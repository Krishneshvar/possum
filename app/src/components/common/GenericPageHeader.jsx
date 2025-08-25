import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ellipsis, ArrowLeft } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function GenericPageHeader({ headerIcon, headerLabel, actions, showBackButton = false }) {
  const primaryAction = actions.primary;
  const secondaryActions = actions.secondary || [];
  const navigate = useNavigate();

  const renderActionButton = (action, isPrimary) => {
    const buttonClasses = isPrimary
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : "bg-slate-200 hover:bg-white text-slate-800 shadow-sm";

    const content = (
      <>
        {action.icon && <action.icon className="h-4 w-4 mr-2" />}
        <span className="truncate">{action.label}</span>
      </>
    );

    if (action.url) {
      return (
        <Button asChild size="default" className={`px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto ${buttonClasses}`}>
          <Link to={action.url}>{content}</Link>
        </Button>
      );
    } else {
      return (
        <Button size="default" onClick={action.onClick} className={`px-4 sm:px-6 font-medium shadow-sm w-full sm:w-auto ${buttonClasses}`}>
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
              className="h-10 w-10 flex-shrink-0 cursor-pointer"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          )}
          {headerIcon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-600/20 shrink-0">
              {headerIcon}
            </div>
          )}
          <div className="min-w-0 flex flex-col">
            <h1 className="text-[1.5rem] font-bold text-slate-900">{headerLabel}</h1>
          </div>

          {secondaryActions.length > 0 && (
            <>
              <div className="flex lg:hidden ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 px-2">
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action, index) => (
                      <DropdownMenuItem key={index} asChild>
                        <Link to={action.url || "#"} className="flex items-center">
                          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </Link>
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
