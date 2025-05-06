import React from "react";

interface LoaderProps {
  className?: string;
  size?: keyof typeof SIZE_MAP;
}

const SIZE_MAP = {
  xl: 44,
  lg: 32,
  md: 24,
  sm: 16,
};

function Loader({ className, size: _size = "md" }: LoaderProps) {
  // Calculate center point and radius based on size
  const size = SIZE_MAP[_size];
  const center = size / 2;
  const maxRadius = size * (20 / 44); // Scale radius proportionally to original 44px size

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      stroke="#fff"
    >
      <g fill="none" fillRule="evenodd" strokeWidth="2">
        <circle cx={center} cy={center} r="1">
          <animate
            attributeName="r"
            begin="0s"
            dur="1.8s"
            values={`1; ${maxRadius}`}
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.165, 0.84, 0.44, 1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="0s"
            dur="1.8s"
            values="1; 0"
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.3, 0.61, 0.355, 1"
            repeatCount="indefinite"
          />
        </circle>
        <circle cx={center} cy={center} r="1">
          <animate
            attributeName="r"
            begin="-0.9s"
            dur="1.8s"
            values={`1; ${maxRadius}`}
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.165, 0.84, 0.44, 1"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            begin="-0.9s"
            dur="1.8s"
            values="1; 0"
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.3, 0.61, 0.355, 1"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  );
}

export default Loader;
