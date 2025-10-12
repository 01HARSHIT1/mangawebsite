'use client';

import React, { useState, useEffect, useRef } fromreact;
import { motion, AnimatePresence } fromframer-motion';
import { HelpCircle, X, Lightbulb, Info, AlertCircle } fromlucide-react;
interface TooltipProps {
  content: string;
  title?: string;
  type?: info| 'tip' | 'warning';
  position?: top' |bottom' | left' | 'right';
  children: React.ReactNode;
  className?: string;
  showOnHover?: boolean;
  persistent?: boolean;
}

const ContextualTooltip: React.FC<TooltipProps> = ({
  content,
  title,
  type = info',
  position =top',
  children,
  className =,showOnHover = true,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () =>[object Object]   if (showOnHover) {
      clearTimeout(timeoutRef.current);
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () =>[object Object]   if (showOnHover && !persistent) [object Object]timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 20   }
  };

  const handleClick = () => [object Object]  if (!showOnHover)[object Object]
      setIsOpen(!isOpen);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsVisible(false);
  };

  useEffect(() => [object Object]   return () => {
      clearTimeout(timeoutRef.current);
    };
  },;

  const getIcon = () => [object Object]
    switch (type)[object Object]      case 'tip':
        return <Lightbulb className="w-4-4ext-yellow-50 />;     case warning':
        return <AlertCircle className=w-4 h-4text-red-500" />;
      default:
        return <Info className=w-4 h-4 text-blue-500 />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      casebottom':
        return top-fullleft-1/2 transform -translate-x-1/2 mt-2;      case 'top':
        return bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'left':
        return right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return left-full top-1/2 transform -translate-y-1/2 ml-2;  default:
        return top-fullleft-1/2 transform -translate-x-1t-2   }
  };

  const getArrowClasses = () => {
    switch (position) {
      casebottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-gray-800rder-l-transparent border-r-transparent border-t-transparent;      case 'top':
        return bottom-0left-1/2 transform -translate-x-1/2late-y-full border-t-gray-800rder-l-transparent border-r-transparent border-b-transparent';
      case 'left':
        return 'right-0 top-1/2 transform -translate-y-1/2late-x-full border-l-gray-800rder-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'left-0 top-1/2 transform -translate-y-1/2 -translate-x-full border-r-gray-800rder-t-transparent border-b-transparent border-l-transparent;  default:
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-gray-800rder-l-transparent border-r-transparent border-t-transparent';
    }
  };

  const shouldShow = isVisible || isOpen;

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity:1scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.2         className={`absolute z-50 ${getPositionClasses()}`}
          >
            {/* Arrow */}
            <div className={`absolute w0h-0 border-4 ${getArrowClasses()}`} />
            
     [object Object]/* Tooltip Content */}
            <div className="bg-gray-800 text-white rounded-lg shadow-lg max-w-xs p-3>             {persistent && (
                <button
                  onClick={handleClose}
                  className="absolute top-1 right-1 p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              
              <div className="flex items-start space-x-2>
                {getIcon()}
                <div className=flex-1 min-w-0
                  {title && (
                    <h4 className="font-semibold text-sm mb-1">{title}</h4>
                  )}
                  <p className="text-sm leading-relaxed">{content}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Specialized tooltip components
export const InfoTooltip: React.FC<Omit<TooltipProps, type'>> = (props) => (
  <ContextualTooltip {...props} type="info" />
);

export const TipTooltip: React.FC<Omit<TooltipProps, type'>> = (props) => (
  <ContextualTooltip {...props} type="tip" />
);

export const WarningTooltip: React.FC<Omit<TooltipProps, type'>> = (props) => (
  <ContextualTooltip {...props} type="warning" />
);

// Interactive help button
export const HelpButton: React.FC<{
  content: string;
  title?: string;
  className?: string;
}> = ({ content, title, className = '' }) => (
  <ContextualTooltip
    content={content}
    title={title}
    type=info"
    showOnHover={false}
    persistent={true}
    className={className}
  >
    <button className=p-1 hover:bg-gray-100dark:hover:bg-gray-800 rounded-full transition-colors">
      <HelpCircle className=w-4 h-4 text-gray-50dark:text-gray-400 />
    </button>
  </ContextualTooltip>
);

export default ContextualTooltip; 