import React, { useState } from 'react';
import { Chip, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { GenericSpeedDialActionProps } from './GenericSpeedDialAction';

type GenericSpeedDialProps = {
  items: GenericSpeedDialActionProps[];
  icon?: React.ReactNode;
  ariaLabel?: string;
};

export const GenericSpeedDial: React.FC<GenericSpeedDialProps> = ({
  items,
  icon = <SpeedDialIcon icon={<EditIcon />} />,
  ariaLabel = 'Speed Dial',
}) => {
  const [isDialOpen, setIsDialOpen] = useState(false);
  return (
    <SpeedDial
      open={isDialOpen}
      onClose={() => setIsDialOpen(false)}
      onClick={() => setIsDialOpen(true)}
      ariaLabel={ariaLabel}
      sx={{ position: 'fixed', bottom: 16, right: 16 }}
      icon={icon}
    >
      {items
        .filter((item) => !item.disabled)
        .map((item, idx) => (
          <SpeedDialAction
            key={idx}
            icon={item.icon}
            tooltipTitle={
              <Chip label={item.tooltipTitle} variant={'outlined'} />
            }
            tooltipOpen={true}
            onClick={() => {
              if (!item.disabled) {
                item.setIsModalOpen(true);
              }
            }}
          />
        ))}
    </SpeedDial>
  );
};
