<template>
    <div class="input-field">
        <div class="input-field__input"
            :class="{
                'input-field__input--readonly':isReadOnly,
                'input-field__input--optional':isOptional,
            }">
            <mu-text-field ref="input"
                v-model="inputValue"
                v-bind="$attrs"
                :placeholder="placeholder"
                :solo="false"
                full-width
                :help-text="description"
                :error-text="inputState=='fail'?inputTip:''"
                :color="inputState=='success'?'#67c23a':''"
                :disabled="isDisabled"
                :readonly="isReadOnly"
                :action-icon="isOptional?':iconfont icondown':''"
                @click.native="showOptionPicker"
                @focus="inputFocused=true"
                @blur="inputFocused=false"
                @change="onInputChange">
                <mu-button slot="append"
                    icon
                    small
                    v-if="!isOptional"
                    :style="{
                        'visibility': !this.isReadOnly&&this.inputFocused?'':'hidden'
                    }"
                    @click.native="reset">
                    <mu-icon 
                        value=":iconfont iconclose">
                    </mu-icon>
                </mu-button>
            </mu-text-field>
        </div>
        <mu-bottom-sheet class="input-field__options"
            v-if="isOptional"
            :open.sync="isPicking">
            <div class="input-field__options-toolbar content__side">
                <mu-button
                    flat
                    color="secondary"
                    @click="hideOptionPicker">
                    取消
                </mu-button>
                <mu-button
                    flat
                    color="secondary"
                    @click="cancelPicked">
                    清除已选
                </mu-button>
            </div>
            <div class="input-field__options-search">
                <search-field v-model="optionSearchVal"
                    :placeholder="optionSearchPlaceholder"
                    small
                    @search="searchOption">
                </search-field>
            </div>
            <div class="input-field__options-expandpath"
                v-if="optionExpandable"
                v-show="expandingOption"
                v-resize="caculateOptionSummaryCount">
                <mu-button icon 
                    @click="backToLastExpand">
                    <mu-icon value=":iconfont iconroundleft">
                    </mu-icon>
                </mu-button>
                <mu-menu cover
                    :open.sync="expandPathMoreOpening"
                    v-show="isOptionExpandPathOmitted">
                    <mu-button icon>
                        <mu-icon size="24"
                            value=":iconfont iconmore">
                        </mu-icon>
                    </mu-button>
                    <mu-list slot="content">
                        <mu-list-item button
                            v-for="option in optionExpandPath"
                            :key="_toOptionLabel(option)"
                            @click.native="backToExpand(option)">
                            <mu-list-item-title>{{_toOptionLabel(option)}}</mu-list-item-title>
                        </mu-list-item>
                    </mu-list>
                </mu-menu>
                <mu-breadcrumbs>
                    <mu-breadcrumbs-item 
                        v-for="option in optionExpandPathSummary" 
                        :key="_toOptionLabel(option)"
                        @click.native="backToExpand(option)">
                        {{_toOptionLabel(option)}}
                    </mu-breadcrumbs-item>
                </mu-breadcrumbs>
            </div>
            <div class="input-field__options-list">
                <mu-load-more :refreshing="isRefreshing"
                    :loading="isLoading"
                    :load-end="optionLoadEnd"
                    @refresh="refreshOption"
                    @load="loadOption">
                    <mu-list :value="_toOptionValue(pickedOption)">
                        <template v-for="option in displayingOptions">
                            <mu-list-item button
                                :key="_toOptionLabel(option)"
                                :ripple="false"
                                :value="_toOptionValue(option)">
                                <mu-list-item-content
                                    :class="{'disabled':option.$disabled}"
                                    @click="pickOption(option)">
                                    <slot name="option-content"
                                        :option="option">
                                        {{_toOptionLabel(option)}}
                                    </slot>
                                </mu-list-item-content>
                                <mu-list-item-action
                                    v-if="optionExpandable">
                                    <mu-button icon
                                        @click="expandOption(option)">
                                        <mu-icon value=":iconfont iconroundright">
                                        </mu-icon>
                                    </mu-button>
                                </mu-list-item-action>
                            </mu-list-item>
                            <mu-divider :key="_toOptionLabel(option)" />
                        </template>
                        <p class="text-center"
                            v-if="isEmptyOptions"
                            v-show="!isLoading">
                            {{optionEmptyMsg}}
                        </p>
                        <p class="text-center"
                            v-else-if="optionLoadEnd"
                            v-show="!isLoading">
                            {{loadEndMsg}}
                        </p>
                    </mu-list>
                </mu-load-more>
            </div>
        </mu-bottom-sheet>
    </div>
</template>
<script>
    import Utils from 'common/utils';
    import searchField from 'components/common/search_field';

    export default {
        props: {
            value: {
                type: String,
            },
            description: {
                type: String,
                default: '',
            },
            picking: {
                type: Boolean,
                default: false,
            },
            readonly: {
                type: Boolean,
                default: false,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
            required: {
                type: Boolean,
                default: false,
            },
            format: {
                type: String,
                default: '',
            },
            failMsg: {
                type: String,
                default: '输入内容格式有误!',
            },
            loadEndMsg: {
                type: String,
                default: '没有更多了~',
            },
            options: {
                type: Array,
                default: -1,
            },
            optionEmptyMsg: {
                type: String,
                default: '暂无可选内容~',
            },
            optionLabelKey: {
                type: String,
            },
            optionIdKey: {
                type: String,
            },
            optionEditable: {
                type: Boolean,
            },
            optionSearchable: {
                type: Boolean,
                default: false,
            },
            optionSearchValue: {
                type: String,
                default: '',
            },
            optionSearchPlaceholder: {
                type: String,
                default: '请输入搜索内容',
            },
            optionExpandMap: {
                type: Object,
            },
            optionExpandKey: {
                type: String,
            },
        },
        data() {
            return {
                inputValue: '',
                inputTip: '',
                inputState: '',
                inputFocused: false,

                isPicking: false,
                displayingOptions: '',

                pickedOption: '',
                optionIdMap: {},
                optionLabelMap: {},
                optionExpandPath: [],
                optionSummaryCount: 2,
                expandPathMoreOpening: false,

                optionSearchVal: '',
                optionRefreshing: false,
                optionLoading: false,
                optionLoadEnd: false,
            };
        },
        computed: {
            placeholder() {
                if(this.isEmptyOptions) {
                    return this.optionEmptyMsg;
                }
                if(this.$attrs.placeholder) {
                    return this.$attrs.placeholder;
                }
                if(this.isOptional) {
                    return '请选择内容';
                }
                if(this.isReadOnly) {
                    return '';
                }
                return '请输入内容';
            },
            isReadOnly() {
                if(this.isOptional && ! this.optionEditable) {
                    return true;
                }
                return this.readonly;
            },
            isDisabled() {
                return this.disabled;
            },
            isOptional() {
                return this.options != -1 ? true : false;
            },
            isEmptyOptions() {
                return this.isOptional && this.displayingOptions !== '' && ! this.displayingOptions.length;
            },
            isLoading() {
                return this.optionLoading || this.displayingOptions === '';
            },
            isRefreshing() {
                return this.optionRefreshing;
            },
            validateRules() {
                if(! this.format) {
                    return;
                }
                return {
                    format: {
                        regex: new RegExp(this.format),
                        fail: () => {
                            return this.failMsg;
                        }
                    },
                };
            },
            optionExpandable() {
                return Utils.isObject(this.optionExpandMap); 
            },
            expandingOption() {
                if(! this.optionExpandPath.length) {
                    return;
                }
                return this.optionExpandPath[this.optionExpandPath.length - 1];
            },
            optionExpandPathSummary() {
                if(! this.optionExpandPath.length) {
                    return [];
                }
                const result = [];
                for(let i = this.optionExpandPath.length - 1; 
                    i >= Math.max(this.optionExpandPath.length - this.optionSummaryCount, 0); 
                    i --) {
                    result.push(this.optionExpandPath[i]);
                }
                return result.reverse();
            },
            isOptionExpandPathOmitted() {
                return this.optionExpandPath.length > this.optionSummaryCount;
            },
        },
        watch: {
            'value': function(newValue) {
                this.inputValue = this._toInputValue(newValue);
            },
            'inputValue': function(newValue) {
                if(newValue && ! this.validate(true)) {
                    this.$emit('input', '');
                    return;
                }
                const realVal = this._toRealValue(newValue, (Utils.isObject(this.value) || this.value === ''));
                this.$emit('input', realVal);
                if(this.isOptional && ! this.pickedOption
                    && this.options.indexOf(realVal) != -1) {
                    this.pickOption(realVal);
                }
            },
            'picking': function(newVal) {
                this.isPicking = newVal;
            },
            'isPicking': function(newVal) {
                if(newVal) {
                    this.$refs.input.focus();
                }
                this.$emit('update:picking', newVal);
            },
            'options': function(newValue, oldValue) {
                if(this.expandingOption) {
                    return;
                }
                this._changeDisplayingOptions(newValue);
                if(this.inputValue && ! this.pickedOption) {
                    const option = this._toRealValue(this.inputValue, (Utils.isObject(this.value) || this.value === ''));
                    if(this.options.indexOf(option) != -1) {
                        this.pickOption(option);
                    }
                }
            },
            'optionSearchValue': function(newVal) {
                this.optionSearchVal = newVal;
            },
            'optionSearchVal': function(newVal) {
                this.$emit('update:optionSearchValue', newVal);
            },
        },
        components: {
            searchField
        },
        methods: {
            _initOptionMap(options) {
                if(! options || ! options.length) {
                    return;
                }
                for(let option of options) {
                    // ??? idkey填错也可能重复!!!
                    this.$set(this.optionIdMap, 
                        this._toOptionValue(option),
                        option);
                    // ??? 名称可能重复!!!
                    this.$set(this.optionLabelMap, 
                        this._toOptionLabel(option),
                        option);
                }
            },
            _setDisplayingOptions(options, optionIdMap) {
                this.displayingOptions = options;
                if(! optionIdMap) {
                    return;
                }
                if(! this.optionIdMap) {
                    this.optionIdMap = optionIdMap;
                    return;
                }
                Object.assign(this.optionIdMap, optionIdMap);
            },
            _setEmptyOptionTip() {
                if(! this.isEmptyOptions) {
                    return false;
                }
                this.inputValue = '';
                return true;
            },
            _toRealValue(inputValue, isObjType) {
                if(this.isOptional) {
                    if(! this.isReadOnly) {
                       return inputValue;
                    }
                    let option, extractFn;
                    if(this._toOptionById(inputValue)) {
                        option = this._toOptionById(inputValue);
                        extractFn = this._toOptionValue;
                    } else {
                        option = this._toOptionByLabel(inputValue);
                        extractFn = this._toOptionLabel;
                    }
                    if(option) {
                        if(isObjType) {
                            return option;
                        }
                        return extractFn(option);
                    }
                }
                return inputValue;
            },
            _toInputValue(realValue) {
                if(this.isOptional) {
                    if(Utils.isObject(realValue)) {
                        if(! this._toOptionById(this._toOptionValue(realValue))) {
                            this._initOptionMap([realValue]);
                        }
                        return this._toOptionLabel(realValue) || '';
                    }
                    if(! this.isReadOnly) {
                       return realValue;
                    }
                    if(this._toOptionById(realValue)) {
                        return this._toOptionLabel(this._toOptionById(realValue));
                    }
                    if(this._toOptionByLabel(realValue)) {
                        return this._toOptionLabel(this._toOptionByLabel(realValue));
                    }
                }
                return realValue;
            },
            _toOptionLabel(option) {
                if(Utils.isObject(option)) {
                    return option[this.optionLabelKey || this.optionIdKey];
                }
                return option; 
            },
            _toOptionValue(option) {
                if(Utils.isObject(option)) {
                    return option[this.optionIdKey];
                }
                return option;
            },
            _toOptionById(id) {
                return this.optionIdMap[id];
            },
            _toOptionByLabel(label) {
                if(! label) {
                    return;
                }
                return this.optionLabelMap[label];
            },
            _changeDisplayingOptions(options) {
                this._setDisplayingOptions(options);
                this._initOptionMap(this.displayingOptions);
            },
            onInputChange() {
                if(this.isOptional) {
                    return;
                }
                this.$emit('change', this.inputValue);
            },
            validate(isChangeTips) {
                if(this.required && ! this.inputValue) {
                    if(isChangeTips) {
                        this.inputState = 'fail';
                        this.inputTip = '必填项不能为空!';
                    }
                    return false;
                }
                if(this.validateRules && this.inputValue) {
                    const result = Utils.validate(this.inputValue, this.validateRules);
                    if(Utils.isFunc(result)) {
                        if(isChangeTips) {
                            this.inputState = 'fail';
                            this.inputTip = result(this.inputValue);
                        }
                        return false;
                    }
                }
                if(isChangeTips) {
                    this.inputState = 'success';
                    this.inputTip = '填写正确';
                }
                return true;
            },
            reset() {
                this.inputValue = '';
                this.$refs.input.focus();
            },
            showOptionPicker() {
                if(! this.isOptional) {
                    return;
                }
                if(this.readonly || this.disabled) {
                    return;
                }
                this.$refs.input.focus();
                this.isPicking = true;
            },
            hideOptionPicker() {
                this.isPicking = false;
            },
            caculateOptionSummaryCount() {
                let result = Math.ceil(this.$el.clientWidth / 200);
                if(result < 2) {
                    result = 2;
                }
                this.optionSummaryCount = result;
            },
            pickOption(option) {
                if(! option || option.$disabled) {
                    this.$emit('click-disabled-option', option);
                    return;
                }
                this.pickedOption = option;
                this.inputValue = this._toInputValue(this.pickedOption);
                this.hideOptionPicker();
                this.$nextTick(() => {
                    this.$emit('option-picked', option);
                });
            },
            getExpandObj(parentOption) {
                return this.optionExpandMap[this._toOptionValue(parentOption)];
            },
            getExpandObjOptions(expandObj) {
                if(! this.optionExpandKey && Utils.isArray(expandObj)) {
                    return expandObj || '';
                }
                return (expandObj && expandObj[this.optionExpandKey]) || '';
            },
            expandOption(parentOption) {
                this.expandPathMoreOpening = false;
                this.optionLoadEnd = false;

                let obj = this.getExpandObj(parentOption);
                if(this.optionExpandPath.indexOf(parentOption) == -1) {
                    this.optionExpandPath.push(parentOption);
                }
                this._setDisplayingOptions(this.getExpandObjOptions(obj));
                if(obj) {
                    return
                }
                this.$emit('option-expand', (isLoadEnd) => {
                    this.optionRefreshing = false;
                    this.optionLoading = false;
                    this.optionLoadEnd = isLoadEnd;
                }, parentOption);
                if(! (obj = this.getExpandObj(parentOption))) {
                    throw new Error('请在option-expand回调中生成ExpandOption的空间');
                }
                const key = this._toOptionValue(parentOption);
                if(this.optionExpandKey) {
                    this.$set(obj, this.optionExpandKey, this.getExpandObjOptions(obj));
                } else {
                    this.$set(this.optionExpandMap, key, obj);
                }
                this.$watch(() => {
                    if(this.optionExpandKey) {
                        return this.optionExpandMap[key][this.optionExpandKey];
                    }
                    return this.optionExpandMap[key];
                }, (newOptions, oldOptions) => {
                    if(newOptions === oldOptions) {
                        return;
                    }
                    this._changeDisplayingOptions(newOptions);
                    this.optionRefreshing = false;
                    this.optionLoading = false;
                });
            },
            backToLastExpand() {
                this.optionExpandPath.pop()
                if(! this.expandingOption) {
                    this._changeDisplayingOptions(this.options);
                    return;
                }
                this.expandOption(this.expandingOption);
            },
            backToExpand(option) {
                const pathIndex = this.optionExpandPath.indexOf(option);
                if(pathIndex == -1) {
                    return;
                }
                this.optionExpandPath.splice(pathIndex + 1, this.optionExpandPath.length);
                this.expandOption(option);
            },
            refreshOption() {
                if(this.optionRefreshing) {
                    return;
                }
                this.optionRefreshing = true;
                this.$emit('option-refresh', (isLoadEnd) => {
                    this.optionRefreshing = false;
                    this.optionLoadEnd = isLoadEnd;
                }, this.expandingOption);
            },
            loadOption() {
                if(this.optionLoading) {
                    return;
                }
                if(this.optionLoadEnd) {
                    return;
                }
                this.optionLoading = true;
                this.$emit('option-load-more', (isLoadEnd) => {
                    this.optionLoading = false;
                    this.optionLoadEnd = isLoadEnd;
                }, this.expandingOption);
            },
            searchOption(searchEndFn) {
                this.optionExpandPath = [];
                this.optionLoadEnd = false;
                this._setDisplayingOptions('');
                
                this.optionLoading = true;
                this.$emit('update:optionSearchValue', this.optionSearchVal);
                this.$emit('option-search', (isLoadEnd) => {
                    searchEndFn && searchEndFn();
                    this.optionLoading = false;
                    this.optionLoadEnd = isLoadEnd;
                }, this.expandingOption);
            },
            cancelPicked() {
                if(! this.pickedOption) {
                    return;
                }
                this.pickedOption = '';
                this.inputValue = '';
                this.hideOptionPicker();
            },
        },
        mounted() {
            if(! this._setEmptyOptionTip()) {
                if(Utils.isObject(this.options[0])) {
                    if(! this.optionIdKey) {
                        throw new Error('对象Option必须至少指定option-value-key');
                    }
                    if(! this.optionLabelKey) {
                        this.optionLabelKey = this.optionIdKey;
                    }
                }
                this._changeDisplayingOptions(this.options);
            }
            this.inputValue = this._toInputValue(this.value);
        },
    }
</script>
<style lang="scss">
    @import 'style/mixin';

    .input-field {
        width: 100%;
        display: flex;
        position: relative;
        .input-field__title {
            display: flex;
            align-items: center;
            line-height: 1.3rem;
            overflow: hidden;
            cite {
                width: 1rem;
                padding: 0 .3rem;
                color: red;
            }
            span {
                display: inline-block;
                word-break: break-all;
                flex: 1 1 auto;
            }
            i {
                width: 1rem;
                padding: 0 .3rem;
            }
        }
        .input-field__input {
            flex: 1 1 auto;
            .mint-field-core {
                border-bottom: 1px solid $border;
            }
            &.input-field__input--readonly {
                .mint-field-core {
                    border: none;
                }
                .mint-field-clear {
                    display: none;
                }
            }
            &.input-field__input--optional {
                .mint-field-core {
                    cursor: pointer;
                }
                .mint-field-clear {
                    margin-right: 2rem;
                }
            }
        }
    }
    .input-field__options {
        width: 100%;
        .iconfont {
            font-size: 24px;
            color: #999;
        }
        .input-field__options-toolbar {
            height: 36px;
            border-bottom: 1px solid $border;
            span {
                height: 2rem;
                line-height: 2rem;
                padding: 0 1rem;
                font-size: 1rem;
            }
        }
        .input-field__options-search {
            padding: .5rem;
        }
        .input-field__options-expandpath {
            max-height: 48px;
            display: flex;
            border-top: 1px solid $border;
            &>* {
                max-height: 48px;
            }
        }
        .input-field__options-list {
            height: 40vh;
            overflow: auto;
            border-top: 1px solid $border;
            -webkit-overflow-scrolling: touch;
            .mu-list {
                padding-top: 0;
                font-size: 16px;
            }
        }
    }
    .input-field~.input-field {
        margin-top: 0;
    }
</style>