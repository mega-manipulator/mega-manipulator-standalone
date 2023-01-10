import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { locations } from './locations';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const nav = useNavigate();
  return (
    <>
      <h1>Not found</h1>
      <p>{location.pathname}</p>
      <p>Page was not found. Bummer.</p>
      <Button
        variant={'outlined'}
        color={'secondary'}
        onClick={() => nav(locations.settings.link)}
      >
        Back
      </Button>
    </>
  );
};
