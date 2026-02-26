import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ellipsis, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Action {
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  url?: string;
}

interface GenericPageHeaderProps {
  headerIcon?: React.ReactNode;
  headerLabel: string;
  actions?: {
    primary?: Action;
    secondary?: Action[];
  };
  showBackButton?: boolean;
}

export default function GenericPageHeader({
  headerIcon,
  headerLabel,
  actions = {},
  showBackButton = false
}: GenericPageHeaderProps) {
  const primaryAction = actions?.primary;
  const secondaryActions = actions?.secondary || [];
  const navigate = useNavigate();

  const renderActionButton = (action: Action, isPrimary: boolean) => {
    const buttonClasses = isPrimary
      ? ""
      : action.label === 'Delete'
        ? ""
        : "";

    const content = (
      <>
        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
        <span className="truncate">{action.label}</span>
      </>
    );

    if (action.label === 'Delete') {
      return (
        <Button
          variant="destructive"
          onClick={action.onClick}
          className={`px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto ${buttonClasses}`}
        >
          {content}
        </Button>
      );
    } else if (action.url) {
      return (
        <Button asChild size="default" variant={isPrimary ? "default" : "secondary"} className={`px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto ${buttonClasses}`}>
          <Link to={action.url}>{content}</Link>
        </Button>
      );
    } else {
      return (
        <Button size="default" variant={isPrimary ? "default" : "secondary"} onClick={action.onClick} className={`px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto ${buttonClasses}`}>
          {content}
        </Button>
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
        <div className="flex items-center gap-3 sm:gap-4 flex-grow">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0 hover:shadow-sm"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Button>
          )}
          {headerIcon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              {headerIcon}
            </div>
          )}
          <div className="min-w-none flex flex-col">
            <h1 className="text-[1.5rem] font-bold text-foreground">{headerLabel}</h1>
          </div>

          {secondaryActions.length > 0 && (
            <>
              <div className="flex lg:hidden ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-2" aria-label="More actions">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        asChild={!!action.url}
                        className={action.label === 'Delete' ? 'text-destructive focus:text-destructive' : ''}
                      >
                        {action.url ? (
                          <Link to={action.url || "#"} className="flex items-center">
                            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                            {action.label}
                          </Link>
                        ) : (
                          <div className="flex items-center">
                            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                            {action.label}
                          </div>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto flex-row-reverse items-center justify-between sm:justify-end">
          {primaryAction && renderActionButton(primaryAction, true)}
          {secondaryActions.length > 0 && (
            <div className="hidden lg:flex gap-2 sm:gap-4">
              {secondaryActions.map((action, index) => (
                <div key={index}>{renderActionButton(action, false)}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
