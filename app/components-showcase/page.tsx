"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Heart, Download, Settings, Plus, Star, Info } from "lucide-react";

export default function ComponentsShowcasePage() {
  const buttonVariants = [
    // Primary Variants
    { variant: "default", label: "Default", category: "Primary" },
    { variant: "secondary", label: "Secondary", category: "Primary" },
    { variant: "accent", label: "Accent", category: "Primary" },
    { variant: "navy", label: "Navy", category: "Primary" },
    
    // Special Effects
    { variant: "glass", label: "Glass", category: "Special Effects" },
    { variant: "gradient", label: "Gradient", category: "Special Effects" },
    { variant: "glassmorphism", label: "Glassmorphism", category: "Special Effects" },
    { variant: "neumorphism", label: "Neumorphism", category: "Special Effects" },
    
    // Border Variants
    { variant: "outline", label: "Outline", category: "Border Variants" },
    { variant: "outline-thick", label: "Thick Outline", category: "Border Variants" },
    { variant: "outline-dashed", label: "Dashed Outline", category: "Border Variants" },
    
    // Minimal Variants
    { variant: "ghost", label: "Ghost", category: "Minimal" },
    { variant: "link", label: "Link", category: "Minimal" },
    { variant: "minimal", label: "Minimal", category: "Minimal" },
    { variant: "text", label: "Text", category: "Minimal" },
    
    // Monochrome Variants
    { variant: "black", label: "Black", category: "Monochrome" },
    { variant: "white", label: "White", category: "Monochrome" },
    { variant: "dark", label: "Dark", category: "Monochrome" },
    { variant: "light", label: "Light", category: "Monochrome" },
    
    // State Variants
    { variant: "success", label: "Success", category: "State" },
    { variant: "warning", label: "Warning", category: "State" },
    { variant: "danger", label: "Danger", category: "State" },
    { variant: "info", label: "Info", category: "State" },
  ] as const;

  const buttonSizes = [
    { size: "xs", label: "Extra Small" },
    { size: "sm", label: "Small" },
    { size: "default", label: "Default" },
    { size: "lg", label: "Large" },
    { size: "xl", label: "Extra Large" },
  ] as const;

  const groupedVariants = buttonVariants.reduce((acc, variant) => {
    if (!acc[variant.category]) {
      acc[variant.category] = [];
    }
    acc[variant.category].push(variant);
    return acc;
  }, {} as Record<string, typeof buttonVariants[number][]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-light/30 to-periwinkle-light/30">
      <Section className="py-8">
        <Container>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-navy-dark mb-4">
              She Sharp 按钮组件展示
            </h1>
            <p className="text-gray max-w-2xl mx-auto">
              全新升级的按钮系统，包含毛玻璃效果、渐变、粗边框等现代化设计元素，
              完全符合 She Sharp 品牌设计规范。
            </p>
            <Badge className="mt-4 bg-mint-dark text-navy-dark">
              Version 2.0 - 全新设计
            </Badge>
          </div>

          {/* Button Variants by Category */}
          {Object.entries(groupedVariants).map(([category, variants]) => (
            <Card key={category} className="mb-8 border-2 border-purple-light/50">
              <CardHeader className="bg-purple-light/20">
                <CardTitle className="text-navy-dark flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-dark" />
                  {category}
                </CardTitle>
                <CardDescription>
                  {category === "Primary" && "主要操作按钮，用于重要的用户操作"}
                  {category === "Special Effects" && "现代化特殊效果，提升视觉体验"}
                  {category === "Border Variants" && "边框样式按钮，适用于次要操作"}
                  {category === "Minimal" && "极简风格，适用于轻量化界面"}
                  {category === "Monochrome" && "黑白系列，经典优雅"}
                  {category === "State" && "状态指示按钮，传达操作结果"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {variants.map((variant) => (
                    <div key={variant.variant} className="text-center space-y-2">
                      <Button variant={variant.variant as any} className="w-full">
                        <Heart className="h-4 w-4" />
                        {variant.label}
                      </Button>
                      <code className="text-xs text-gray bg-gray-100 px-2 py-1 rounded">
                        variant="{variant.variant}"
                      </code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Button Sizes */}
          <Card className="mb-8 border-2 border-mint-light/50">
            <CardHeader className="bg-mint-light/20">
              <CardTitle className="text-navy-dark flex items-center gap-2">
                <Settings className="h-5 w-5 text-mint-dark" />
                尺寸系统
              </CardTitle>
              <CardDescription>
                从超小到超大，适应不同场景需求
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                {buttonSizes.map((size) => (
                  <div key={size.size} className="text-center space-y-2">
                    <Button size={size.size as any} variant="default">
                      <Plus className="h-4 w-4" />
                      {size.label}
                    </Button>
                    <code className="text-xs text-gray bg-gray-100 px-2 py-1 rounded">
                      size="{size.size}"
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Button with Icons */}
          <Card className="mb-8 border-2 border-periwinkle-light/50">
            <CardHeader className="bg-periwinkle-light/20">
              <CardTitle className="text-navy-dark flex items-center gap-2">
                <Info className="h-5 w-5 text-periwinkle-dark" />
                图标按钮示例
              </CardTitle>
              <CardDescription>
                内置图标支持，完美对齐和间距
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="default">
                  <Heart className="h-4 w-4" />
                  喜欢
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4" />
                  下载
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4" />
                  设置
                </Button>
                <Button variant="ghost">
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Demo */}
          <Card className="border-2 border-navy-light/50">
            <CardHeader className="bg-navy-light/20">
              <CardTitle className="text-navy-dark">
                交互体验测试
              </CardTitle>
              <CardDescription>
                体验悬停、点击和焦点状态的动画效果
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-gray">
                  <strong>提示:</strong> 尝试悬停、点击和使用键盘导航来体验所有交互效果
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="gradient" size="lg">
                    <Star className="h-5 w-5" />
                    渐变特效
                  </Button>
                  <Button variant="glass" size="lg">
                    <Heart className="h-5 w-5" />
                    毛玻璃效果
                  </Button>
                  <Button variant="outline-thick" size="lg">
                    <Download className="h-5 w-5" />
                    粗边框样式
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Tips */}
          <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
            <h3 className="text-lg font-semibold text-navy-dark mb-3">使用建议</h3>
            <ul className="space-y-2 text-sm text-gray">
              <li>• <strong>Primary (默认):</strong> 用于主要操作，如"提交"、"保存"</li>
              <li>• <strong>Secondary:</strong> 用于重要但非主要的操作</li>
              <li>• <strong>Outline:</strong> 用于次要操作或取消按钮</li>
              <li>• <strong>Ghost:</strong> 用于轻量化界面中的操作</li>
              <li>• <strong>Glass/Gradient:</strong> 用于特殊场景，营造现代感</li>
              <li>• <strong>State variants:</strong> 用于反馈操作结果</li>
            </ul>
          </div>
        </Container>
      </Section>
    </div>
  );
}
