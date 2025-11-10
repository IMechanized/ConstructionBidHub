import { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, RotateCcw, Settings } from "lucide-react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onLayoutChange?: (layout: Layout[]) => void;
}

const STORAGE_KEY = "dashboard-widget-layout";

export function DashboardWidgets({ widgets, onLayoutChange }: DashboardWidgetsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [layouts, setLayouts] = useState<{ lg: Layout[] }>({ lg: [] });

  // Initialize or load layout
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { layouts: savedLayouts, hidden } = JSON.parse(stored);
        setLayouts(savedLayouts);
        setHiddenWidgets(hidden || []);
      } else {
        // Create default layout
        const defaultLayout = widgets.map((widget, index) => ({
          i: widget.id,
          x: (index % 2) * 6,
          y: Math.floor(index / 2) * 4,
          w: widget.defaultSize.w,
          h: widget.defaultSize.h,
          minW: widget.minSize?.w || 2,
          minH: widget.minSize?.h || 2,
        }));
        setLayouts({ lg: defaultLayout });
      }
    } catch (error) {
      console.error("Failed to load dashboard layout:", error);
    }
  }, [widgets]);

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { lg: Layout[] }) => {
    setLayouts(allLayouts);
    onLayoutChange?.(currentLayout);
    
    // Save to localStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layouts: allLayouts,
          hidden: hiddenWidgets,
        })
      );
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
    }
  };

  const hideWidget = (widgetId: string) => {
    const updated = [...hiddenWidgets, widgetId];
    setHiddenWidgets(updated);
    
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layouts,
          hidden: updated,
        })
      );
    } catch (error) {
      console.error("Failed to save hidden widgets:", error);
    }
  };

  const showWidget = (widgetId: string) => {
    const updated = hiddenWidgets.filter(id => id !== widgetId);
    setHiddenWidgets(updated);
    
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layouts,
          hidden: updated,
        })
      );
    } catch (error) {
      console.error("Failed to save hidden widgets:", error);
    }
  };

  const resetLayout = () => {
    const defaultLayout = widgets.map((widget, index) => ({
      i: widget.id,
      x: (index % 2) * 6,
      y: Math.floor(index / 2) * 4,
      w: widget.defaultSize.w,
      h: widget.defaultSize.h,
      minW: widget.minSize?.w || 2,
      minH: widget.minSize?.h || 2,
    }));
    setLayouts({ lg: defaultLayout });
    setHiddenWidgets([]);
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to reset layout:", error);
    }
  };

  const visibleWidgets = widgets.filter(w => !hiddenWidgets.includes(w.id));
  const hiddenCount = hiddenWidgets.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            data-testid="button-toggle-edit-mode"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? "Done Editing" : "Customize"}
          </Button>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
              data-testid="button-reset-layout"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Layout
            </Button>
          )}
        </div>
      </div>

      {isEditing && hiddenCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hidden Widgets ({hiddenCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {widgets
                .filter(w => hiddenWidgets.includes(w.id))
                .map(widget => (
                  <Button
                    key={widget.id}
                    variant="outline"
                    size="sm"
                    onClick={() => showWidget(widget.id)}
                    data-testid={`button-show-widget-${widget.id}`}
                  >
                    + {widget.title}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        compactType="vertical"
        preventCollision={false}
      >
        {visibleWidgets.map(widget => (
          <div key={widget.id} data-testid={`widget-${widget.id}`}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isEditing && (
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    )}
                    {widget.title}
                  </CardTitle>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => hideWidget(widget.id)}
                      data-testid={`button-hide-widget-${widget.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="overflow-auto" style={{ maxHeight: "calc(100% - 60px)" }}>
                {widget.component}
              </CardContent>
            </Card>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
