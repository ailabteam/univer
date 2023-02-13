import { Plugin, UniverSheet, Tools, PLUGIN_NAMES } from '@univerjs/core';
import { zh, en } from './Locale';
import { DefaultSheetUiConfig, installObserver, ISheetUIPluginConfig, SheetUIPluginObserve, SHEET_UI_PLUGIN_NAME } from './Basics';
import { Context } from '@univerjs/core/src/Basics/Context';
import { ComponentManager, getRefElement, RegisterManager } from '@univerjs/base-ui';
import { Engine, RenderEngine } from '@univerjs/base-render';
import { AppUIController } from './Controller/AppUIController';

export class SheetUIPlugin extends Plugin<SheetUIPluginObserve, Context> {
    private _appUIController: AppUIController;

    private _componentManager: ComponentManager;

    private _registerManager: RegisterManager;

    private _config: ISheetUIPluginConfig;

    constructor(config?: ISheetUIPluginConfig) {
        super(SHEET_UI_PLUGIN_NAME);
        this._config = Tools.deepMerge({}, DefaultSheetUiConfig, config);
    }

    static create(config?: ISheetUIPluginConfig) {
        return new SheetUIPlugin(config);
    }

    installTo(univerInstance: UniverSheet) {
        univerInstance.installPlugin(this);
    }

    initialize(ctx: Context): void {
        installObserver(this);
        const context = this.getContext();
        /**
         * load more Locale object
         */
        context.getLocale().load({
            zh,
            en,
        });

        this._componentManager = new ComponentManager();
        this._registerManager = new RegisterManager(this);
        this._appUIController = new AppUIController(this);
        this.initRender();
    }

    getConfig() {
        return this._config;
    }

    initRender() {
        const engine = this.getPluginByName<RenderEngine>(PLUGIN_NAMES.BASE_RENDER)?.getEngine()!;
        let container = getRefElement(this._appUIController.getSheetContainerController().getContentRef());

        // mount canvas to DOM container
        engine.setContainer(container);

        window.addEventListener('resize', () => {
            engine.resize();
        });

        // should be clear
        setTimeout(() => {
            engine.resize();
        }, 0);
    }

    initUI() {}

    onMounted(ctx: Context): void {
        this.initialize(ctx);
    }

    onDestroy(): void {}

    getAppUIController() {
        return this._appUIController;
    }

    getComponentManager() {
        return this._componentManager;
    }

    /**
     * usage this._clipboardExtensionManager.handle(data);
     * @returns
     */
    getRegisterManager(): RegisterManager {
        return this._registerManager;
    }
}