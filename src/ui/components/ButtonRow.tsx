import React, { ReactNode } from 'react';

export const ButtonRow: React.FC<{ children: ReactNode[] }> = ({
  children,
}) => {
  return (
    <p
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridColumnGap: '10px',
      }}
    >
      {children}
    </p>
  );
};
