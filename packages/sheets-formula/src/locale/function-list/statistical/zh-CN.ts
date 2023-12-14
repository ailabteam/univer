/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export default {
    AVERAGE: {
        description: '返回参数的平均值（算术平均值）。',
        abstract: '返回参数平均值',
        functionParameter: {
            number1: {
                name: '数值1',
                detail: '要计算平均值的第一个数字、单元格引用或单元格区域。',
            },
            number2: {
                name: '数值2',
                detail: '要计算平均值的其他数字、单元格引用或单元格区域，最多可包含 255 个。',
            },
        },
    },
    COUNT: {
        description: '计算包含数字的单元格个数以及参数列表中数字的个数。',
        abstract: '计算参数列表中数字的个数',
        functionParameter: {
            value1: {
                name: '值1',
                detail: '要计算其中数字的个数的第一项、单元格引用或区域。',
            },
            value2: {
                name: '值2',
                detail: '要计算其中数字的个数的其他项、单元格引用或区域，最多可包含 255 个。',
            },
        },
    },
    MAX: {
        description: '返回一组值中的最大值。',
        abstract: '返回参数列表中的最大值',
        functionParameter: {
            number1: {
                name: '数值1',
                detail: '要计算最大值的第一个数字、单元格引用或单元格区域。',
            },
            number2: {
                name: '数值2',
                detail: '要计算最大值的其他数字、单元格引用或单元格区域，最多可包含 255 个。',
            },
        },
    },
    MIN: {
        description: '返回一组值中的最小值。',
        abstract: '返回参数列表中的最小值',
        functionParameter: {
            number1: {
                name: '数值1',
                detail: '要计算最小值的第一个数字、单元格引用或单元格区域。',
            },
            number2: {
                name: '数值2',
                detail: '要计算最小值的其他数字、单元格引用或单元格区域，最多可包含 255 个。',
            },
        },
    },
    COUNT_A: {
        description: `计算包含任何类型的信息（包括错误值和空文本 ("")）的单元格
        如果不需要对逻辑值、文本或错误值进行计数（换句话说，只希望对包含数字的单元格进行计数），请使用 COUNT 函数。`,
        abstract: '计算范围中不为空的单元格的个数。',
        functionParameter: {
            number1: {
                name: '数值1',
                detail: '必需。 表示要计数的值的第一个参数',
            },
            number2: {
                name: '数值2',
                detail: '可选。 表示要计数的值的其他参数，最多可包含 255 个参数。',
            },
        },
    },
};
