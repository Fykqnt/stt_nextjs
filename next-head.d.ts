declare module "next/head" {
  import React from "react";

  interface HeadProps {
    children?: React.ReactNode;
  }

  const Head: React.FC<HeadProps>;
  export default Head;
} 