import { Button } from "@/components/ui/button";
import { History, ShoppingCart } from "lucide-react";

interface SalesControlsProps {
    view: 'cart' | 'history';
    setView: (view: 'cart' | 'history') => void;
}

export default function SalesControls({ view, setView }: SalesControlsProps) {
    return (
        <div className="flex bg-muted p-1 rounded-lg w-fit">
            <Button
                variant={view === 'cart' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('cart')}
                className="gap-2"
            >
                <ShoppingCart className="h-4 w-4" />
                New Sale
            </Button>
            <Button
                variant={view === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('history')}
                className="gap-2"
            >
                <History className="h-4 w-4" />
                History
            </Button>
        </div>
    );
}
