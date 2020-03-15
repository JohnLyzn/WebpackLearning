<template>
    <mu-text-field class="search-field"
        :class="{
            'search-field--small': small,
        }"
        ref="input"
        v-model="searchValue"
        v-bind="$attrs"
        :solo="true"
        full-width
        @keyup.enter.native="search">
        <div slot="append">
            <mu-icon class="search-field__clear"
                v-show="searchValue"
                size="18"
                value=":iconfont iconclose"
                @click="reset()">
            </mu-icon>
            <mu-button 
                icon
                :loading="isSearching"
                @click="search(true)">
                <mu-icon size="24"
                    value=":iconfont iconsearch">
                </mu-icon>
            </mu-button>
        </div>
    </mu-text-field>
</template>
<script>
    export default {
        name: 'search-field',
        props: {
            value: {
                type: String,
            },
            small: {
                type: Boolean,
                default: false,
            },
        },
        data() { 
            return {
                lastSearchValue: '',
                searchValue: this.value,
                isSearching: false,
                isFocused: false,
            };
        },
        watch: {
            searchValue: function(newValue, oldValue) {
                this.$emit('input', newValue);
                /* 由非空转空时自动触发一次搜索, 同时重置搜索 */
                if(! this.isSameAsLastSearch && ! newValue && oldValue) {
                    this._endSearching();
                    this.$nextTick(() => {
                        this.search();
                    });
                }
            },
            value: function(newValue, oldValue) {
                this.searchValue = newValue;
            }
        },
        computed: {
            isSameAsLastSearch() {
                return this.lastSearchValue == this.searchValue;
            },
        },
        methods: {
            _startSearching() {
                this.isSearching = true;
            },
            _endSearching() {
                this.isSearching = false;
            },
            search() {
                if(! this.searchValue && this.isSameAsLastSearch) {
                    return;
                }
                this.lastSearchValue = this.searchValue;
                this._startSearching();
                this.$emit('search', this._endSearching.bind(this), this.searchValue);
            },
            getSearchValue() {
                return this.searchValue;
            },
            reset() {
                this.searchValue = '';
            },
        },
        mounted() {
            // this.searchValue = this.value;
        }
    } 
</script>
<style lang="scss">
    .search-field {
        width: 100%;
        height: 48px;
        border: 1px solid #ddd;
        padding-left: 1rem;
        border-radius: 3rem;
        .search-field__clear {
            cursor: pointer;
        }
    }
    .search-field--small {
        height: 36px;
        padding: 0;
        .mu-input-content {
            padding: 0 4px 0 16px;
            line-height: 36px;
        }
        .mu-button {
            width: 36px;
            height: 36px;
        }
    }
    
</style>
