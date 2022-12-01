var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dom from '../behaviors/dom';
import touch from '../behaviors/touch';
import { SuperComponent, wxComponent } from '../common/src/index';
import props from './props';
import config from '../common/config';
const { prefix } = config;
const name = `${prefix}-tabs`;
var Position;
(function (Position) {
    Position["top"] = "top";
    Position["right"] = "right";
    Position["bottom"] = "bottom";
    Position["left"] = "left";
})(Position || (Position = {}));
let Tabs = class Tabs extends SuperComponent {
    constructor() {
        super(...arguments);
        this.behaviors = [dom, touch];
        this.externalClasses = [`${prefix}-class`, `${prefix}-class-item`, `${prefix}-class-active`, `${prefix}-class-track`];
        this.relations = {
            './tab-panel': {
                type: 'descendant',
                linked(target) {
                    this.children.push(target);
                    target.index = this.children.length - 1;
                    this.updateTabs();
                },
                unlinked(target) {
                    this.children = this.children.filter((item) => item.index !== target.index);
                    this.updateTabs(() => this.setTrack());
                },
            },
        };
        this.properties = props;
        this.controlledProps = [
            {
                key: 'value',
                event: 'change',
            },
        ];
        this.observers = {
            value(name) {
                if (name !== this.getCurrentName()) {
                    this.setCurrentIndexByName(name);
                }
            },
            placement() {
                this.adjustPlacement();
            },
        };
        this.data = {
            prefix,
            classPrefix: name,
            tabs: [],
            currentIndex: -1,
            trackStyle: '',
            isScrollX: true,
            isScrollY: false,
            direction: 'X',
            offset: 0,
        };
        this.methods = {
            adjustPlacement() {
                const { placement } = this.properties;
                let isScrollX = false;
                let isScrollY = false;
                if (placement === Position.top || placement === Position.bottom) {
                    isScrollX = true;
                }
                else {
                    isScrollY = true;
                }
                this.setData({
                    isScrollX,
                    isScrollY,
                    direction: isScrollX ? 'X' : 'Y',
                });
            },
        };
    }
    created() {
        this.children = this.children || [];
    }
    attached() {
        wx.nextTick(() => {
            this.setTrack();
        });
        this.adjustPlacement();
        this.gettingBoundingClientRect(`.${name}`).then((res) => {
            this.containerWidth = res.width;
        });
    }
    updateTabs(cb) {
        const { children } = this;
        const tabs = children.map((child) => child.data);
        this.setData({ tabs }, cb);
        this.setCurrentIndexByName(this.properties.value);
    }
    setCurrentIndexByName(name) {
        const { children } = this;
        const index = children.findIndex((child) => child.getComputedName() === `${name}`);
        if (index > -1) {
            this.setCurrentIndex(index);
        }
    }
    setCurrentIndex(index) {
        if (index <= -1 || index >= this.children.length)
            return;
        this.children.forEach((child, idx) => {
            const isActive = index === idx;
            if (isActive !== child.data.active) {
                child.render(isActive, this);
            }
        });
        if (this.data.currentIndex === index)
            return;
        this.setData({
            currentIndex: index,
        });
        this.setTrack();
    }
    getCurrentName() {
        if (this.children) {
            const activeTab = this.children[this.data.currentIndex];
            if (activeTab) {
                return activeTab.getComputedName();
            }
        }
    }
    calcScrollOffset(containerWidth, targetLeft, targetWidth, offset) {
        return offset + targetLeft - (1 / 2) * containerWidth + targetWidth / 2;
    }
    getTrackSize() {
        return new Promise((resolve) => {
            if (this.trackWidth) {
                resolve(this.trackWidth);
                return;
            }
            this.gettingBoundingClientRect(`.${prefix}-tabs__track`).then((res) => {
                if (res) {
                    this.trackWidth = res.width;
                    resolve(this.trackWidth);
                }
            });
        });
    }
    setTrack() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.properties.showBottomLine)
                return;
            const { children } = this;
            if (!children)
                return;
            const { currentIndex, isScrollX, direction } = this.data;
            if (currentIndex <= -1)
                return;
            try {
                const res = yield this.gettingBoundingClientRect(`.${prefix}-tabs__item`, true);
                const rect = res[currentIndex];
                if (!rect)
                    return;
                let count = 0;
                let distance = 0;
                for (const item of res) {
                    if (count < currentIndex) {
                        distance += isScrollX ? item.width : item.height;
                        count += 1;
                    }
                }
                if (this.containerWidth) {
                    const offset = this.calcScrollOffset(this.containerWidth, rect.left, rect.width, this.data.offset);
                    if (offset > 0) {
                        this.setData({
                            offset,
                        });
                    }
                }
                if (isScrollX) {
                    const trackLineWidth = yield this.getTrackSize();
                    distance += (rect.width - trackLineWidth) / 2;
                }
                let trackStyle = `-webkit-transform: translate${direction}(${distance}px);
        transform: translate${direction}(${distance}px);
      `;
                if (!isScrollX) {
                    trackStyle += `height: ${rect.height}px;`;
                }
                this.setData({
                    trackStyle,
                });
            }
            catch (err) {
                this.triggerEvent('error', err);
            }
        });
    }
    onTabTap(event) {
        const { index } = event.currentTarget.dataset;
        this.changeIndex(index);
    }
    onTouchStart(event) {
        if (!this.properties.swipeable)
            return;
        this.touchStart(event);
    }
    onTouchMove(event) {
        if (!this.properties.swipeable)
            return;
        this.touchMove(event);
    }
    onTouchEnd() {
        if (!this.properties.swipeable)
            return;
        const { direction, deltaX, offsetX } = this;
        const minSwipeDistance = 50;
        if (direction === 'horizontal' && offsetX >= minSwipeDistance) {
            const index = this.getAvailableTabIndex(deltaX);
            if (index !== -1) {
                this.changeIndex(index);
            }
        }
    }
    onTouchScroll(event) {
        this._trigger('scroll', event.detail);
    }
    changeIndex(index) {
        const currentTab = this.data.tabs[index];
        const { value, label } = currentTab;
        if (!(currentTab === null || currentTab === void 0 ? void 0 : currentTab.disabled) && index !== this.data.currentIndex) {
            this._trigger('change', { value, label });
        }
        this._trigger('click', { value, label });
    }
    getAvailableTabIndex(deltaX) {
        const step = deltaX > 0 ? -1 : 1;
        const { currentIndex, tabs } = this.data;
        const len = tabs.length;
        for (let i = step; currentIndex + step >= 0 && currentIndex + step < len; i += step) {
            const newIndex = currentIndex + i;
            if (newIndex >= 0 && newIndex < len && tabs[newIndex] && !tabs[newIndex].disabled) {
                return newIndex;
            }
        }
        return -1;
    }
};
Tabs = __decorate([
    wxComponent()
], Tabs);
export default Tabs;
