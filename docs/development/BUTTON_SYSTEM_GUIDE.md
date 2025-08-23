# She Sharp 按钮系统 2.0 - 使用指南

## 🎉 新功能介绍

我们的按钮系统已全面升级！新系统包含：
- ✨ **27种按钮变体**，包括毛玻璃、渐变、粗边框等现代效果
- 🎯 **6种尺寸选择**，从超小到超大适应所有场景
- 🌟 **丰富的交互动效**，包括悬浮提升、阴影跟随等
- ♿ **无障碍优化**，完全符合 WCAG AA 标准
- 🎨 **完全符合品牌色彩规范**

## 📍 快速访问

**组件展示页面**: [/components-showcase](/components-showcase)  
**管理员快捷入口**: Dashboard > Admin Panel > Quick Actions > UI Components

## 🔧 基础用法

### 导入组件
```tsx
import { Button } from "@/components/ui/button";
```

### 基础用法
```tsx
<Button>默认按钮</Button>
<Button variant="secondary">次要按钮</Button>
<Button variant="outline">边框按钮</Button>
<Button size="lg">大按钮</Button>
```

## 🎨 按钮变体详解

### 主要变体 (Primary Variants)
| 变体 | 用途 | 示例 |
|------|------|------|
| `default` | 主要操作，如提交表单 | 立即加入、捐赠支持 |
| `secondary` | 重要但非主要操作 | 了解更多、查看详情 |
| `accent` | 成功状态、积极操作 | 报名成功、完成任务 |
| `navy` | 专业、正式的操作 | 官方声明、政策页面 |

### 特殊效果 (Special Effects)
| 变体 | 效果 | 适用场景 |
|------|------|----------|
| `glass` | 毛玻璃半透明 | 覆盖层、弹窗操作 |
| `gradient` | 紫色到蓝色渐变 | 特色功能、CTA 按钮 |
| `glassmorphism` | 增强版毛玻璃 | 高端界面、特殊展示 |
| `neumorphism` | 新拟物化设计 | 现代界面、设计展示 |

### 边框样式 (Border Variants)
| 变体 | 外观 | 使用建议 |
|------|------|----------|
| `outline` | 标准边框 | 次要操作、取消按钮 |
| `outline-thick` | 4px 粗边框 | 强调重要性但非主要 |
| `outline-dashed` | 虚线边框 | 特殊状态、草稿模式 |

### 极简样式 (Minimal Variants)
| 变体 | 特点 | 使用场景 |
|------|------|----------|
| `ghost` | 透明背景，hover 有色 | 工具栏、导航菜单 |
| `link` | 链接样式，带下划线 | 内联链接、跳转操作 |
| `minimal` | 纯文字，微妙 hover | 轻量界面、辅助功能 |
| `text` | 文字按钮，圆角背景 | 标签操作、过滤器 |

### 黑白系列 (Monochrome)
| 变体 | 颜色 | 适用场景 |
|------|------|----------|
| `black` | 纯黑背景 | 高对比度、极简设计 |
| `white` | 纯白背景 | 深色背景上使用 |
| `dark` | 深海蓝背景 | 夜间模式、专业界面 |
| `light` | 浅灰背景 | 柔和界面、辅助操作 |

### 状态指示 (State Variants)
| 变体 | 颜色 | 语义 |
|------|------|------|
| `success` | 薄荷绿 | 成功完成、确认操作 |
| `warning` | 黄色 | 警告、需要注意 |
| `danger` | 红色 | 删除、危险操作 |
| `info` | 蓝色 | 信息提示、帮助 |

## 📏 尺寸系统

| 尺寸 | 高度 | 使用场景 |
|------|------|----------|
| `xs` | 24px | 标签内按钮、紧凑界面 |
| `sm` | 32px | 表格操作、卡片按钮 |
| `default` | 40px | 标准界面按钮 |
| `lg` | 48px | 重要 CTA、表单提交 |
| `xl` | 56px | 首页 CTA、特大操作 |
| `icon` | 40x40px | 纯图标按钮 |

## 🎯 使用建议

### 1. 语义化使用
```tsx
// ✅ 推荐：根据语义选择变体
<Button variant="default">提交申请</Button>
<Button variant="outline">取消</Button>
<Button variant="danger">删除账户</Button>

// ❌ 不推荐：仅根据视觉效果选择
<Button variant="gradient">取消</Button>
```

### 2. 尺寸搭配
```tsx
// ✅ 推荐：主要操作用大尺寸
<Button variant="default" size="lg">立即加入 She Sharp</Button>
<Button variant="outline" size="sm">了解更多</Button>

// ✅ 推荐：表格操作用小尺寸
<Button variant="ghost" size="xs">编辑</Button>
```

### 3. 图标搭配
```tsx
// ✅ 自动处理图标大小和间距
<Button variant="default">
  <Heart className="h-4 w-4" />
  捐赠支持
</Button>

// ✅ 纯图标按钮
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

## 🎨 动效特性

### 悬浮效果
- **提升动画**: `-translate-y-0.5` 或 `-translate-y-1`
- **阴影跟随**: `shadow-xl shadow-[color]/25`
- **缩放效果**: `scale-105` (仅限 gradient 变体)

### 交互反馈
- **点击**: `active:scale-95` 按压效果
- **焦点**: 增强的 `focus-visible` 样式
- **过渡**: `transition-all duration-300` 流畅动画

## 🔄 迁移指南

### 从旧系统升级
```tsx
// 旧版本
<Button className="bg-purple-dark hover:bg-purple-mid">
  
// 新版本 - 使用语义化变体
<Button variant="default">

// 旧版本 - 自定义样式
<Button className="border-2 border-purple-dark text-purple-dark">

// 新版本 - 使用标准变体
<Button variant="outline">
```

### 保持向后兼容
- 现有的 `variant` 和 `size` props 保持不变
- 可以继续使用 `className` 进行微调
- 不会破坏现有代码

## 🚀 最佳实践

### 1. 按钮层次
- **主要操作**: `variant="default"` + `size="lg"`
- **次要操作**: `variant="outline"` + `size="default"`
- **辅助操作**: `variant="ghost"` + `size="sm"`

### 2. 颜色搭配
- 同一界面不超过 3 种按钮颜色
- 保持视觉层次的一致性
- 使用状态变体传达明确信息

### 3. 响应式设计
```tsx
// 移动端优化
<Button 
  size="default" 
  className="w-full sm:w-auto"
>
  响应式按钮
</Button>
```

## 🐛 问题反馈

如果遇到问题或有改进建议，请：
1. 访问 [组件展示页面](/components-showcase) 测试现有变体
2. 在 GitHub 提交 Issue
3. 联系开发团队

---

**版本**: 2.0  
**更新日期**: 2024年  
**兼容性**: 完全向后兼容  
