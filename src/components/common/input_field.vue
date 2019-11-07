<template>
    <div class="input-field">
        <div class="input-field__input"
            :class="{
                'input-field__input--readonly':isReadOnly,
                'input-field__input--optional':isOptional,
                'input-field__input--disabled':isDisabled,
                'input-field__input--multiple':isMultiple,
            }">
            <mu-text-field ref="input"
                :class="{'picked':pickedOptionIds.length}"
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
                :action-click="showOptionPicker"
                @click.native="showOptionPicker(true)"
                @focus="inputFocused=true"
                @blur="inputFocused=false">
                <div v-if="isMultiple"
                    v-show="pickedOptionIds.length"
                    ref="multiBlock"
                    class="input-field__input-multi-block">
                    <mu-chip v-for="option in pickedOptions"
                        :key="_toOptionId(option)"
                        delete
                        @delete="unpickOption(option)"
                        @click="showOptionPicker()">
                        <slot name="picked-option-chip"
                            :option="option">
                            {{_toOptionLabel(option)}}
                        </slot>
                    </mu-chip>
                </div>
                <mu-button slot="append"
                    icon
                    small
                    v-if="!isOptional"
                    :style="{
                        'visibility': !this.isReadOnly&&this.inputFocused?'':'hidden'
                    }"
                    @click.native="reset">
                    <mu-icon value=":iconfont iconclose">
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
                    @click="hideOptionPicker()">
                    取消
                </mu-button>
                <div class="content__end">
                    <mu-button
                        flat
                        color="secondary"
                        @click="resetPicked()">
                        {{isMultiple?'清空已选':'清除已选'}}
                    </mu-button>
                    <mu-button v-if="isMultiple"
                        flat
                        color="secondary"
                        @click="hideOptionPicker()">
                        确定
                    </mu-button>
                </div>
            </div>
            <div class="input-field__options-search"
                v-show="optionSearchable">
                <search-field v-model="optionSearchVal"
                    :placeholder="optionSearchPlaceholder"
                    small
                    :searching="isOptionLoading"
                    @search="searchOption">
                </search-field>
            </div>
            <div class="input-field__options-expandpath"
                v-if="optionExpandable"
                v-show="expandingOption"
                v-resize="caculateOptionSummaryCount">
                <mu-button icon 
                    @click="backToLastExpand()">
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
                            :key="_toOptionId(option)"
                            @click.native="backToExpand(option)">
                            <mu-list-item-title>
                                {{_toOptionLabel(option)}}
                            </mu-list-item-title>
                        </mu-list-item>
                    </mu-list>
                </mu-menu>
                <mu-breadcrumbs>
                    <mu-breadcrumbs-item 
                        v-for="option in optionExpandPathSummary" 
                        :key="_toOptionId(option)"
                        @click.native="backToExpand(option)">
                        {{_toOptionLabel(option)}}
                    </mu-breadcrumbs-item>
                </mu-breadcrumbs>
            </div>
            <div class="input-field__options-list">
                <mu-load-more :refreshing="isRefreshing"
                    :loading="isLoading"
                    :load-end="isOptionLoadEnd"
                    @refresh="refreshOption"
                    @load="loadOption">
                    <mu-list :value="isMultiple?null:pickedOptionIds[0]">
                        <template v-for="option in displayingOptions">
                            <mu-list-item button
                                :key="_toOptionId(option)"
                                :ripple="false"
                                :value="_toOptionId(option)"
                                @contextmenu.prevent.native="showOptionDetail(option)"
                                @click="pickOption(option,true)">
                                <mu-list-item-action
                                    v-if="isMultiple">
                                    <mu-checkbox v-model="pickedOptionIds"
                                        :value="_toOptionId(option)"
                                        :input-value="_toOptionId(option)"
                                        :disabled="option.$disabled"
                                        @click.stop>
                                    </mu-checkbox>
                                </mu-list-item-action>
                                <mu-list-item-content
                                    :class="{'disabled':option.$disabled}">
                                    <slot name="option-content"
                                        :option="option">
                                        {{_toOptionLabel(option)}}
                                    </slot>
                                </mu-list-item-content>
                                <mu-list-item-action
                                    v-if="optionExpandable&&!option.$leaf">
                                    <mu-button icon
                                        @click.stop="expandOption(option)">
                                        <mu-icon value=":iconfont iconroundright">
                                        </mu-icon>
                                    </mu-button>
                                </mu-list-item-action>
                            </mu-list-item>
                            <mu-divider :key="_toOptionId(option)" />
                        </template>
                        <p style="padding-top:40px;"
                            class="text-center"
                            v-if="isEmptyOptions"
                            v-show="!isLoading">
                            {{optionEmptyMsg}}
                        </p>
                        <p class="text-center"
                            v-else-if="isOptionLoadEnd"
                            v-show="!isLoading">
                            {{optionLoadEndMsg}}
                        </p>
                    </mu-list>
                </mu-load-more>
            </div>
        </mu-bottom-sheet>
    </div>
</template>
<script>
    import Utils from 'common/utils';
    import {confirm} from 'common/env';
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
            options: {
                type: Array,
                default: -1,
            },
            optionIdKey: {
                type: String,
                default: 'id',
            },
            optionLabelKey: {
                type: String,
                default: 'name',
            },
            optionEmptyMsg: {
                type: String,
                default: '暂无可选内容~',
            },
            optionRefreshing: {
                type: Boolean,
                default: false,
            },
            optionLoading: {
                type: Boolean,
                default: false,
            },
            optionLoadEnd: {
                type: Boolean,
                default: false,
            },
            optionLoadEndMsg: {
                type: String,
                default: '没有更多了~',
            },
            optionMultiple: {
                type: Boolean,
                defalult: false,
            },
            optionMultiPickClearMsg: {
                type: String,
                default: '将清空所有已选的内容，确定吗？',
            },
            optionEditable: {
                type: Boolean,
                defalult: false,
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
            optionExpanding: {
                type: Object,
                default: undefined,
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

                pickedOptionIds: [], /* 可能为单选也可能为多选 */
                optionIdMap: {},
                optionLabelMap: {},
                optionExpandingRoot: '',
                optionLastExpanding: '',
                optionExpandPath: [],
                optionSummaryCount: 2,
                expandPathMoreOpening: false,

                optionSearchVal: '',

                isOptionRefreshing: false,
                isOptionLoading: false,
                isOptionLoadEnd: false,

                isHandlingOptionCheckBoxChange: false,
            };
        },
        computed: {
            placeholder() {
                if(! this.isMultiple 
                    && this.isEmptyOptions) {
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
                return this.disabled ? true : false;
            },
            isMultiple() {
                if(! this.isOptional) {
                    return false;
                }
                return this.optionMultiple;
            },
            isOptional() {
                return this.options != -1 ? true : false;
            },
            isEmptyOptions() {
                return this.isOptional && this.displayingOptions !== '' && ! this.displayingOptions.length;
            },
            isLoading() {
                return this.isOptionLoading;
            },
            isRefreshing() {
                return this.isOptionRefreshing || this.displayingOptions === '';
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
                return this.optionExpanding !== undefined; 
            },
            expandingOption() {
                if(! this.optionExpandPath.length) {
                    return;
                }
                return this.optionExpandPath[this.optionExpandPath.length - 1];
            },
            optionExpandRoot() {
                if(! this.optionExpandingRoot) {
                    return '';
                }
                return this.optionExpandingRoot;
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
            pickedOptions() {
                if(! this.isMultiple) {
                    return this._toOptionById(this.pickedOptionIds[0]);
                }
                const result = [];
                for(let id of this.pickedOptionIds) {
                    if(! id) {
                        continue;
                    }
                    result.push(this._toOptionById(id));
                }
                return result;
            },
            isObjTypeBinding() {
                if(! this.isOptional) {
                    return false;
                }
                if(Utils.isObject(this.value)) {
                    return true;
                }
                return this.options.length && Utils.isObject(this.options[0]);
            },
        },
        watch: {
            'value': function(newValue) {
                if(this.isMultiple) {
                    this._mergePickedOptionIds(newValue);
                    return;
                }
                this.inputValue = this._toInputValue(newValue);
            },
            'inputValue': function(newValue) {
                if(this.isMultiple) {
                    return;
                }
                if(newValue && ! this.validate(true)) {
                    this.$emit('input', '');
                    this.$emit('change', '');
                    return;
                }
                const realVal = this._toRealValue(newValue);
                this.$emit('input', realVal);
                this.$emit('change', realVal);
                if(this.isOptional) {
                    this.pickOption(realVal);
                }
            },
            'options': function(newValue) {
                this._checkOptions();
                this._changeDisplayingOptions(newValue);
                if(! this.isMultiple 
                    && this.inputValue 
                    && ! this.pickedOptionIds.length) {
                    this.pickOption(this._toRealValue(this.inputValue));
                }
            },
            'optionRefreshing': function(newVal) {
                if(newVal) {
                    this.isOptionRefreshing = true;
                    return;
                }
                this.isOptionRefreshing = false;
                this.isOptionLoading = false;
            },
            'optionLoading': function(newVal) {
                if(newVal) {
                    this.isOptionLoading = true;
                    return;
                }
                this.isOptionRefreshing = false;
                this.isOptionLoading = false;
            },
            'optionLoadEnd': function(newVal) {
                this.isOptionLoadEnd = newVal;
                if(newVal) {
                    this.isOptionRefreshing = false;
                    this.isOptionLoading = false;
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
            'pickedOptions': function(newVal, oldVal) {
                if(! this.isMultiple) {
                    // 单个的由改变inputValue来触发
                    return;
                }
                this.inputValue = '';
                this.$emit('input', newVal);
                this.$emit('change', newVal);
                if(newVal.length >= oldVal.length) {
                    this.$nextTick(() => {
                        this.focusMultiBlockScroll();
                    });
                }
            },
            'optionSearchValue': function(newVal) {
                this.optionSearchVal = newVal;
            },
            'optionSearchVal': function(newVal) {
                this.$emit('update:optionSearchValue', newVal);
            },
            'optionExpanding': function(newVal) {
                if(! this.optionExpandingRoot && newVal) {
                    this.optionExpandingRoot = newVal;
                }
                if(newVal === this.optionLastExpanding) {
                    return;
                }
                this.expandOption(newVal);
            },
        },
        components: {
            searchField
        },
        methods: {
            _mergeOptionMap(options) {
                if(! options || ! options.length) {
                    return;
                }
                for(let option of options) {
                    if(! this._toOptionId(option)
                        || ! this._toOptionLabel(option)) {
                        continue;
                    }
                    // ??? idkey填错也可能重复!!!
                    this.$set(this.optionIdMap, 
                        this._toOptionId(option),
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
            _checkOptions() {
                if(! this._setEmptyOptionTip()) {
                    if(Utils.isObject(this.options[0])) {
                        if(! this.optionIdKey) {
                            throw new Error('对象Option必须至少指定option-id-key');
                        }
                        if(! this.optionLabelKey) {
                            this.optionLabelKey = this.optionIdKey;
                        }
                    }
                }
            },
            _setEmptyOptionTip() {
                if(! this.isEmptyOptions) {
                    return false;
                }
                this.inputValue = '';
                return true;
            },
            _toRealValue(inputValue) {
                if(this.isOptional) {
                    let option, extractFn;
                    if(this._toOptionById(inputValue)) {
                        option = this._toOptionById(inputValue);
                        extractFn = this._toOptionId;
                    } else {
                        option = this._toOptionByLabel(inputValue);
                        extractFn = this._toOptionLabel;
                    }
                    if(option) {
                        if(this.isObjTypeBinding) {
                            return option;
                        }
                        return extractFn(option);
                    }
                }
                return inputValue;
            },
            _toInputValue(realValue) {
                if(this.isOptional) {
                    if(Utils.isObject(realValue)
                        && this._toOptionId(realValue)
                        && this._toOptionLabel(realValue)) {
                        if(! this._toOptionById(this._toOptionId(realValue))) {
                            this._mergeOptionMap([realValue]);
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
            _toOptionId(option) {
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
                this._mergeOptionMap(options);
            },
            _mergePickedOptionIds(options) {
                if(! options) {
                    options = [];
                }
                let isChanged = false;
                if(options.length == this.pickedOptionIds.length) {
                    for(let option of options) {
                        if(! this._toOptionId(option)
                            || ! this._toOptionLabel(option)) {
                            continue;
                        }
                        if(this.pickedOptionIds.indexOf(this._toOptionId(option)) == -1) {
                            isChanged = true;
                            break;
                        }
                    }
                } else {
                    isChanged = true;
                }
                if(isChanged) {
                    const newPickedOptionIds = [];
                    for(let option of options) {
                        if(! this._toOptionId(option)
                            || ! this._toOptionLabel(option)) {
                            continue;
                        }
                        newPickedOptionIds.push(this._toOptionId(option));
                    }
                    this.pickedOptionIds = newPickedOptionIds;
                    this._mergeOptionMap(options);
                }
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
            focus() {
                this.$refs.input.focus();
            },
            showOptionPicker(isCheckEditable) {
                if(! this.isOptional) {
                    return;
                }
                if(isCheckEditable && this.optionEditable) {
                    return;
                }
                if(this.readonly || this.disabled) {
                    return;
                }
                this.$refs.input.focus();
                this.isPicking = true;
            },
            refreshOption() {
                if(this.isOptionRefreshing) {
                    return;
                }
                this.isOptionRefreshing = true;
                this.$emit('option-refresh', this.expandingOption);
                this.setOptionLoadingMinTimer();
            },
            loadOption() {
                if(this.isOptionLoading) {
                    return;
                }
                if(this.isOptionLoadEnd) {
                    return;
                }
                this.isOptionLoading = true;
                this.$emit('option-load-more', this.expandingOption);
                this.setOptionLoadingMinTimer();
            },
            setOptionLoadingMinTimer() {
                // 在指定超短时间内, 没有进行加载且已加载全部初始化为true
                // 则直接自动设置为全部加载结束
                setTimeout(() => {
                    if(! this.optionLoading) {
                        this.isOptionRefreshing = false;
                        this.isOptionLoading = false;
                        if(this.optionLoadEnd) {
                            this.isOptionLoadEnd = true;
                        }
                    }
                }, 0);
            },
            searchOption() {
                this.optionExpandPath = [];
                this.isOptionLoadEnd = false;
                this._setDisplayingOptions('');
                
                this.isOptionLoading = true;
                this.$emit('update:optionSearchValue', this.optionSearchVal);
                this.$emit('option-search', this.expandingOption);
                this.setOptionLoadingMinTimer();
            },
            focusMultiBlockScroll() {
                if(this.$refs && this.$refs.multiBlock) {
                    this.$refs.multiBlock.scrollTop 
                        = this.$refs.multiBlock.scrollHeight;
                }
            },
            pickOption(option, isManual) {
                if(option && option.$pureParent) {
                    this.expandOption(option);
                    return;
                }
                if(option && option.$disabled) {
                    this.$emit('click-disabled-option', option);
                    return;
                }
                const optionId = this._toOptionId(option);
                if(this.isMultiple) {
                    if(this.pickedOptionIds.indexOf(optionId) != -1) {
                        if(isManual) {
                            this.unpickOption(option);
                        }
                        return;
                    }
                    this.pickedOptionIds.push(optionId);
                } else {
                    const lastPicked = this.pickedOptionIds[0];
                    this.$set(this.pickedOptionIds, 0, optionId);
                    this.inputValue = this._toInputValue(option);
                    this.hideOptionPicker();
                    if(lastPicked == optionId) {
                        return;
                    }
                }
            },
            showOptionDetail(option) {
                this.$emit('option-contextmenu', option);
            },
            unpickOption(option) {
                if(! this.isMultiple || ! option) {
                    return;
                }
                const optionId = this._toOptionId(option);
                const index = this.pickedOptionIds.indexOf(optionId);
                if(index == -1) {
                    return;
                }
                this.pickedOptionIds.splice(index, 1);
            },
            resetPicked(isSkipConfirm) {
                if(! this.pickedOptionIds) {
                    return;
                }
                if(this.isMultiple) {
                    if(! isSkipConfirm) {
                        if(! this.pickedOptionIds.length) {
                            return;
                        }
                        confirm(this.optionMultiPickClearMsg, '警告', (result) => {
                            if(result.result) {
                                this.resetPicked(true);
                                return;
                            }
                        });
                        return;
                    }
                }
                this.pickedOptionIds = [];
                this.inputValue = '';
                this.hideOptionPicker();
            },
            expandOption(parentOption) {
                if(! parentOption) {
                    parentOption = this.optionExpandRoot;
                }
                if(parentOption.$leaf) {
                    this.$emit('expand-leaf-option', parentOption);
                    return;
                }
                this.expandPathMoreOpening = false;
                this.isOptionLoadEnd = false;
                if(parentOption !== this.optionExpandRoot
                    && this.optionExpandPath.indexOf(parentOption) == -1) {
                    this.optionExpandPath.push(parentOption);
                }
                this.optionLastExpanding = parentOption;
                this.$emit('update:option-expanding', parentOption);
                this.$emit('option-expand', parentOption);
            },
            backToLastExpand() {
                this.optionExpandPath.pop()
                this.expandOption(this.expandingOption);
            },
            backToExpand(option) {
                const pathIndex = this.optionExpandPath.indexOf(option);
                if(pathIndex == -1) {
                    return;
                }
                this.optionExpandPath.splice(pathIndex + 1, 
                    this.optionExpandPath.length);
                this.expandOption(option);
            },
            caculateOptionSummaryCount() {
                let result = Math.ceil(this.$el.clientWidth / 200);
                if(result < 2) {
                    result = 2;
                }
                this.optionSummaryCount = result;
            },
            hideOptionPicker() {
                this.isPicking = false;
            },
        },
        mounted() {
            if(this.options) {
                this._checkOptions();
                this._changeDisplayingOptions(this.options);
            }
            if(this.value) {
                this.inputValue = this._toInputValue(this.value);
            }
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
            &.input-field__input--disabled {
                .mu-input-action-icon, input, textarea {
                    color: #666;
                    cursor: not-allowed;
                }
            }
            &.input-field__input--multiple {
                .mu-input.picked>.mu-input-content>input,
                .mu-input.picked>.mu-input-content>textarea,
                .mu-input.picked>.mu-input-content>.mu-text-field-multiline {
                    width: 0;
                }
                .mu-input-content>input,
                .mu-input-content>textarea,
                .mu-input-content>.mu-text-field-multiline {
                    min-height: 44px;
                }
            }
            .input-field__input-multi-block {
                width: 100%;
                min-height: 44px;
                height: 100%;
                max-height: 648px;
                align-self: start;
                overflow-y: auto;
                text-align: left;
                padding-bottom: 8px;
                padding-right: 8px;
                .mu-chip {
                    margin-top: 4px;
                    margin-left: 4px;
                }
            }
        }
    }
    .input-field__options {
        width: 100%;
        min-height: 360px;
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
                min-height: 120px;
                padding-top: 0;
                font-size: 16px;
                overflow: hidden;
            }
        }
    }
    .input-field~.input-field {
        margin-top: 0;
    }
</style>