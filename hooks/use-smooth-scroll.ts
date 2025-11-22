import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useSmoothScroll() {
  const router = useRouter();

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const url = new URL(href, window.location.origin);
    const hash = url.hash;
    const pathname = url.pathname;
    
    // 如果是当前页面的锚点
    if (pathname === window.location.pathname && hash) {
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        const yOffset = -20; // Small offset for spacing
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    } else if (pathname !== window.location.pathname && hash) {
      // 如果是跳转到其他页面的锚点，使用 router.push
      // 让默认行为处理，不阻止事件
      // ScrollToHash 组件会在页面加载后处理滚动
    }
  }, []);

  return handleSmoothScroll;
}