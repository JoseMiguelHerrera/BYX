import { cn } from "@/utils/classnames";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { AnimatePresence, motion } from "motion/react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export const Modal = ({ isOpen, onClose, children, className }: ModalProps) => {
  const [show, setShow] = useState(false);

  // Handle show/hide for animation
  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      // Wait for fade-out before unmount
      const timeout = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen && !show) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black opacity-50`}
          onClick={onClose}
        />

        {/* Modal Content */}
        <div
          className={cn(
            "relative z-10 rounded-lg p-6 shadow-lg transform transition-opacity duration-300",
            "text-foreground flex w-fit flex-col",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className={cn("w-full flex justify-end")}>
            <button
              className="text-gray-500 hover:text-black"
              onClick={onClose}
            >
              <Image src="/svg/close.svg" alt="Close" width={16} height={16} />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.getElementById("modal-root") as HTMLElement
  );
};
