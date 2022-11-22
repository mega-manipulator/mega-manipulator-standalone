import React from "react";

export const ButtonRow: React.FC<{ children: JSX.Element[] }> = ({children}) => {
  return <p style={{
    display: "grid",
    gridAutoFlow: "column",
    gridColumnGap: '10px',
  }}>{children}</p>
};
