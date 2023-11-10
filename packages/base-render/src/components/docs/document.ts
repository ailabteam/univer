import './extensions';

import {
    BooleanNumber,
    HorizontalAlign,
    Nullable,
    Observable,
    Observer,
    VerticalAlign,
    WrapStrategy,
} from '@univerjs/core';

import { calculateRectRotate, getRotateOffsetAndFarthestHypotenuse } from '../../basics/draw';
import {
    IDocumentSkeletonCached,
    IDocumentSkeletonPage,
    LineType,
    PageLayoutType,
} from '../../basics/i-document-skeleton-cached';
import { degToRad, fixLineWidthByScale, getScale } from '../../basics/tools';
import { Transform } from '../../basics/transform';
import { IBoundRect, Vector2 } from '../../basics/vector2';
import { Scene } from '../../scene';
import { DocumentsSpanAndLineExtensionRegistry, IExtensionConfig } from '../extension';
import { Liquid } from './common/liquid';
import { DocComponent } from './doc-component';
import { DOCS_EXTENSION_TYPE } from './doc-extension';
import { DocumentSkeleton } from './doc-skeleton';

interface PageMarginLayout {
    pageMarginLeft: number;
    pageMarginTop: number;
    pageLayoutType?: PageLayoutType;
}

export interface IDocumentsConfig extends PageMarginLayout {
    allowCache?: boolean;
    hasEditor?: boolean;
}

export interface IPageRenderConfig {
    page: IDocumentSkeletonPage;
    pageLeft: number;
    pageTop: number;
    ctx: CanvasRenderingContext2D;
}

export interface IDocumentOffsetConfig extends PageMarginLayout {
    docsLeft: number;
    docsTop: number;
    documentTransform: Transform;
}

export class Documents extends DocComponent {
    isCalculateSkeleton = true;

    onPageRenderObservable = new Observable<IPageRenderConfig>();

    docsLeft: number = 0;

    docsTop: number = 0;

    private _drawLiquid: Liquid;

    private _findLiquid: Liquid;

    // private _hasEditor = false;

    // private _editor: Nullable<DocsEditor>;

    private _skeletonObserver: Nullable<Observer<IDocumentSkeletonCached>>;

    // private _textAngleRotateOffset: number = 0;

    constructor(oKey: string, documentSkeleton?: DocumentSkeleton, config?: IDocumentsConfig) {
        super(oKey, documentSkeleton, config?.allowCache);

        this.setConfig(config);

        this._drawLiquid = new Liquid();

        this._findLiquid = new Liquid();

        this._initialDefaultExtension();

        // this._addSkeletonChangeObserver(documentSkeleton);

        this.makeDirty(true);
    }

    // get hasEditor() {
    //     return this._hasEditor;
    // }

    static create(oKey: string, documentSkeleton?: DocumentSkeleton, config?: IDocumentsConfig) {
        return new Documents(oKey, documentSkeleton, config);
    }

    setConfig(config?: IDocumentsConfig) {
        this.pageMarginLeft = config?.pageMarginLeft || 17;

        this.pageMarginTop = config?.pageMarginTop || 14;

        this.pageLayoutType = config?.pageLayoutType || PageLayoutType.VERTICAL;

        this.setAllowCache(config?.allowCache || false);
    }

    getOffsetConfig(): IDocumentOffsetConfig {
        const {
            transform: documentTransform,
            pageLayoutType,
            pageMarginLeft,
            pageMarginTop,
            left: docsLeft,
            top: docsTop,
        } = this;

        return {
            documentTransform,
            pageLayoutType,
            pageMarginLeft,
            pageMarginTop,
            docsLeft,
            docsTop,
        };
    }

    // calculatePagePosition() {
    //     const scene = this.getScene() as Scene;

    //     const parent = scene?.getParent();
    //     const { width: docsWidth, height: docsHeight, pageMarginLeft, pageMarginTop } = this;
    //     if (parent == null || docsWidth === Infinity || docsHeight === Infinity) {
    //         return this;
    //     }
    //     const { width: engineWidth, height: engineHeight } = parent;
    //     let docsLeft = 0;
    //     let docsTop = 0;

    //     let sceneWidth = 0;

    //     let sceneHeight = 0;

    //     if (engineWidth > docsWidth) {
    //         docsLeft = engineWidth / 2 - docsWidth / 2;
    //         sceneWidth = engineWidth - 30;
    //     } else {
    //         docsLeft = pageMarginLeft;
    //         sceneWidth = docsWidth + pageMarginLeft * 2;
    //     }

    //     if (engineHeight > docsHeight) {
    //         docsTop = engineHeight / 2 - docsHeight / 2;
    //         sceneHeight = engineHeight - 30;
    //     } else {
    //         docsTop = pageMarginTop;
    //         sceneHeight = docsHeight + pageMarginTop * 2;
    //     }

    //     this.docsLeft = docsLeft;

    //     this.docsTop = docsTop;

    //     scene.resize(sceneWidth, sceneHeight + 200);

    //     this.translate(docsLeft, docsTop);

    //     return this;
    // }

    override getEngine() {
        return (this.getScene() as Scene).getEngine();
    }

    override draw(ctx: CanvasRenderingContext2D, bounds?: IBoundRect) {
        const documentSkeleton = this.getSkeleton();
        if (!documentSkeleton) {
            return;
        }

        // if (this.isCalculateSkeleton) {
        //     documentSkeleton.calculate(bounds);
        // }

        this._drawLiquid.reset();

        const skeletonData = documentSkeleton.getSkeletonData();

        if (skeletonData == null) {
            return;
        }

        const { pages } = skeletonData;
        const parentScale = this.getParentScale();
        const extensions = this.getExtensionsByOrder();
        const scale = getScale(parentScale);
        for (const extension of extensions) {
            extension.clearCache();
        }

        // broadcasting the pageTop and pageLeft for each page in the document with multiple pages.
        let pageTop = 0;
        let pageLeft = 0;

        for (let i = 0, len = pages.length; i < len; i++) {
            const page = pages[i];
            const {
                sections,
                marginTop: pagePaddingTop = 0,
                marginBottom: pagePaddingBottom = 0,
                marginLeft: pagePaddingLeft = 0,
                marginRight: pagePaddingRight = 0,
                width: actualWidth,
                height: actualHeight,
                renderConfig = {},
            } = page;
            const {
                verticalAlign = VerticalAlign.TOP,
                horizontalAlign = HorizontalAlign.LEFT,
                centerAngle: centerAngleDeg = 0,
                vertexAngle: vertexAngleDeg = 0,
                wrapStrategy = WrapStrategy.UNSPECIFIED,
                isRotateNonEastAsian = BooleanNumber.FALSE,
            } = renderConfig;

            const horizontalOffsetNoAngle = this._horizontalHandler(
                actualWidth * scale,
                pagePaddingLeft * scale,
                pagePaddingRight * scale,
                horizontalAlign
            );
            const verticalOffsetNoAngle = this._verticalHandler(
                actualHeight * scale,
                pagePaddingTop * scale,
                pagePaddingBottom * scale,
                verticalAlign
            );
            const alignOffsetNoAngle = Vector2.create(horizontalOffsetNoAngle / scale, verticalOffsetNoAngle / scale);

            const centerAngle = degToRad(centerAngleDeg);

            const vertexAngle = degToRad(vertexAngleDeg);

            const finalAngle = vertexAngle - centerAngle;

            this.onPageRenderObservable.notifyObservers({
                page,
                pageLeft,
                pageTop,
                ctx,
            });

            this._startRotation(ctx, finalAngle);

            for (const section of sections) {
                const { columns } = section;

                this._drawLiquid.translateSection(section);

                for (const column of columns) {
                    const { lines, width: columnWidth } = column;

                    this._drawLiquid.translateColumn(column);

                    const linesCount = lines.length;

                    let alignOffset;
                    let rotateTranslateXListApply = null;
                    if (vertexAngle !== 0) {
                        const {
                            rotateTranslateXList,
                            rotatedHeight,
                            rotatedWidth,
                            fixOffsetX,
                            fixOffsetY,
                            rotateTranslateY,
                        } = getRotateOffsetAndFarthestHypotenuse(lines, columnWidth, vertexAngle);

                        let exceedWidthFix = rotatedWidth;
                        if (rotatedHeight > this.height && wrapStrategy !== WrapStrategy.WRAP) {
                            if (wrapStrategy === WrapStrategy.OVERFLOW || vertexAngle > 0) {
                                exceedWidthFix = this.height / Math.tan(Math.abs(vertexAngle));
                            }
                        }

                        const horizontalOffset = this._horizontalHandler(
                            exceedWidthFix,
                            pagePaddingLeft,
                            pagePaddingRight,
                            horizontalAlign
                        );

                        const verticalOffset = this._verticalHandler(
                            rotatedHeight,
                            pagePaddingTop,
                            pagePaddingBottom,
                            verticalAlign
                        );

                        let exceedHeightFix = verticalOffset - fixOffsetY;
                        if (rotatedHeight > this.height) {
                            if (vertexAngle < 0) {
                                exceedHeightFix = this.height - (rotatedHeight + fixOffsetY);
                            } else {
                                exceedHeightFix = -fixOffsetY;
                            }
                        }
                        alignOffset = Vector2.create(horizontalOffset + fixOffsetX, exceedHeightFix);

                        this._drawLiquid.translate(0, -rotateTranslateY);

                        rotateTranslateXListApply = rotateTranslateXList;
                    } else {
                        alignOffset = alignOffsetNoAngle;
                    }

                    for (let i = 0; i < linesCount; i++) {
                        const line = lines[i];
                        const {
                            divides,

                            asc = 0,
                            type,
                            lineHeight = 0,
                        } = line;

                        const maxLineAsc = asc;

                        const maxLineAscSin = maxLineAsc * Math.sin(centerAngle);
                        const maxLineAscCos = maxLineAsc * Math.cos(centerAngle);

                        if (type === LineType.BLOCK) {
                            for (const extension of extensions) {
                                if (extension.type === DOCS_EXTENSION_TYPE.LINE) {
                                    extension.extensionOffset = {
                                        alignOffset,
                                        renderConfig,
                                    };
                                    extension.draw(ctx, parentScale, line);
                                }
                            }
                        } else {
                            this._drawLiquid.translateSave();

                            this._drawLiquid.translateLine(line, true);
                            rotateTranslateXListApply && this._drawLiquid.translate(rotateTranslateXListApply[i]); // x axis offset

                            const divideLength = divides.length;
                            for (let i = 0; i < divideLength; i++) {
                                const divide = divides[i];
                                const { spanGroup } = divide;
                                this._drawLiquid.translateSave();

                                this._drawLiquid.translateDivide(divide);
                                for (const span of spanGroup) {
                                    if (!span.content || span.content.length === 0) {
                                        continue;
                                    }

                                    const { width: spanWidth, left: spanLeft, paddingLeft } = span;
                                    const { x: translateX, y: translateY } = this._drawLiquid;
                                    const originTranslate = Vector2.create(
                                        fixLineWidthByScale(translateX, scale),
                                        fixLineWidthByScale(translateY, scale)
                                    );
                                    const centerPoint = Vector2.create(
                                        fixLineWidthByScale(spanWidth / 2, scale),
                                        fixLineWidthByScale(lineHeight / 2, scale)
                                    );
                                    const spanStartPoint = calculateRectRotate(
                                        originTranslate.addByPoint(
                                            fixLineWidthByScale(spanLeft + paddingLeft, scale),
                                            0
                                        ),
                                        centerPoint,
                                        centerAngle,
                                        vertexAngle,
                                        alignOffset
                                    );

                                    const spanPointWithFont = calculateRectRotate(
                                        originTranslate.addByPoint(
                                            fixLineWidthByScale(spanLeft + maxLineAscSin + paddingLeft, scale),
                                            fixLineWidthByScale(maxLineAscCos, scale)
                                        ),
                                        centerPoint,
                                        centerAngle,
                                        vertexAngle,
                                        alignOffset
                                    );

                                    const extensionOffset: IExtensionConfig = {
                                        originTranslate,
                                        spanStartPoint,
                                        spanPointWithFont,
                                        centerPoint,
                                        alignOffset,
                                        renderConfig,
                                    };

                                    for (const extension of extensions) {
                                        if (extension.type === DOCS_EXTENSION_TYPE.SPAN) {
                                            extension.extensionOffset = extensionOffset;
                                            extension.draw(ctx, parentScale, span);
                                        }
                                    }
                                }
                                this._drawLiquid.translateRestore();
                            }
                            this._drawLiquid.translateRestore();
                        }
                    }
                }
            }

            this._resetRotation(ctx, finalAngle);

            const { x, y } = this._drawLiquid.translatePage(
                page,
                this.pageLayoutType,
                this.pageMarginLeft,
                this.pageMarginTop
            );
            pageLeft += x;
            pageTop += y;
        }
    }

    changeSkeleton(newSkeleton: DocumentSkeleton) {
        // this._disposeSkeletonChangeObserver(this.getSkeleton());
        this.setSkeleton(newSkeleton);
        // this._addSkeletonChangeObserver(newSkeleton);
        return this;
    }

    protected override _draw(ctx: CanvasRenderingContext2D, bounds?: IBoundRect) {
        this.draw(ctx, bounds);
    }

    private _horizontalHandler(
        pageWidth: number,
        pagePaddingLeft: number,
        pagePaddingRight: number,
        horizontalAlign: HorizontalAlign
    ) {
        let offsetLeft = 0;
        if (horizontalAlign === HorizontalAlign.CENTER) {
            offsetLeft = (this.width - pageWidth) / 2;
        } else if (horizontalAlign === HorizontalAlign.RIGHT) {
            offsetLeft = this.width - pageWidth - pagePaddingRight;
        } else {
            offsetLeft = pagePaddingLeft;
        }

        return offsetLeft;
    }

    private _verticalHandler(
        pageHeight: number,
        pagePaddingTop: number,
        pagePaddingBottom: number,
        verticalAlign: VerticalAlign
    ) {
        let offsetTop = 0;
        if (verticalAlign === VerticalAlign.MIDDLE) {
            offsetTop = (this.height - pageHeight) / 2;
        } else if (verticalAlign === VerticalAlign.BOTTOM) {
            offsetTop = this.height - pageHeight - pagePaddingBottom;
        } else {
            offsetTop = pagePaddingTop;
        }
        return offsetTop;
    }

    private _startRotation(ctx: CanvasRenderingContext2D, textAngle: number) {
        ctx.rotate(textAngle || 0);
    }

    private _resetRotation(ctx: CanvasRenderingContext2D, textAngle: number) {
        ctx.rotate(-textAngle || 0);
    }

    private _initialDefaultExtension() {
        DocumentsSpanAndLineExtensionRegistry.getData().forEach((extension) => {
            this.register(extension);
        });
    }

    // private _addSkeletonChangeObserver(skeleton?: DocumentSkeleton) {
    //     if (!skeleton) {
    //         return;
    //     }

    //     this._skeletonObserver = skeleton.onRecalculateChangeObservable.add((data) => {
    //         const pages = data.pages;
    //         let width = 0;
    //         let height = 0;
    //         for (let i = 0, len = pages.length; i < len; i++) {
    //             const page = pages[i];
    //             const { pageWidth, pageHeight } = page;
    //             if (this.pageLayoutType === PageLayoutType.VERTICAL) {
    //                 height += pageHeight;
    //                 if (i !== len - 1) {
    //                     height += this.pageMarginTop;
    //                 }
    //                 width = Math.max(width, pageWidth);
    //             } else if (this.pageLayoutType === PageLayoutType.HORIZONTAL) {
    //                 width += pageWidth;
    //                 if (i !== len - 1) {
    //                     width += this.pageMarginLeft;
    //                 }
    //                 height = Math.max(height, pageHeight);
    //             }
    //         }

    //         this.resize(width, height);
    //         this.calculatePagePosition();
    //     });
    // }

    // private _disposeSkeletonChangeObserver(skeleton?: DocumentSkeleton) {
    //     if (!skeleton) {
    //         return;
    //     }
    //     skeleton.onRecalculateChangeObservable.remove(this._skeletonObserver);
    // }

    // private _getPageBoundingBox(page: IDocumentSkeletonPage) {
    //     const { pageWidth, pageHeight } = page;
    //     const { x: startX, y: startY } = this._findLiquid;

    //     let endX = -1;
    //     let endY = -1;
    //     if (this.pageLayoutType === PageLayoutType.VERTICAL) {
    //         endX = pageWidth;
    //         endY = startY + pageHeight;
    //     } else if (this.pageLayoutType === PageLayoutType.HORIZONTAL) {
    //         endX = startX + pageWidth;
    //         endY = pageHeight;
    //     }

    //     return {
    //         startX,
    //         startY,
    //         endX,
    //         endY,
    //     };
    // }

    // private _translatePage(page: IDocumentSkeletonPage) {
    //     this._findLiquid.translatePage(page, this.pageLayoutType, this.pageMarginLeft, this.pageMarginTop);
    // }
}