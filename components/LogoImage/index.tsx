import { cn } from "@/utils/classnames";
import Image from "next/image";
import React from "react";

type LogoImageProps = {
  width: number;
  height: number;
  src: string;
  className?: string;
  alt: string;
};

function LogoImage(props: LogoImageProps) {
  const [showImage, setShowImage] = React.useState(true);

  if (!showImage) {
    <div
      className={cn("rounded-full bg-white/50", props.className)}
      style={{
        width: props.width,
        height: props.height,
      }}
    />;
  }

  return <Image {...props} onError={() => setShowImage(false)} />;
}

export default LogoImage;
