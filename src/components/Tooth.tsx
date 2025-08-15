import React from 'react';
import { Box, Button, Tooltip, Badge } from '@mui/material';
import { useChartStore } from '@/state/chartStore';
import { ToothSurface, getToothLabel } from '@/lib/numbering';

interface ToothProps {
  toothNumber: number;
  surfaces?: ToothSurface[];
  plannedCount?: number;
  completedCount?: number;
  isSelected?: boolean;
  onClick?: (toothNumber: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  onSurfaceToggle?: (surface: ToothSurface) => void;
  numberingSystem: 'universal' | 'fdi' | 'palmer';
  dentition: 'adult' | 'primary' | 'mixed';
  ariaLabel?: string;
}

export const Tooth: React.FC<ToothProps> = ({
  toothNumber,
  surfaces = [],
  plannedCount = 0,
  completedCount = 0,
  isSelected = false,
  onClick,
  onSurfaceToggle,
  numberingSystem,
  dentition,
  ariaLabel
}) => {
  const label = ariaLabel || getToothLabel(toothNumber, numberingSystem, dentition);

  return (
    <Tooltip title={label} arrow>
      <Button
        variant="outlined"
        aria-label={label}
        tabIndex={0}
        sx={{
          minWidth: 40,
          minHeight: 40,
          borderRadius: '50%',
          borderColor: isSelected ? 'primary.main' : 'grey.400',
          boxShadow: isSelected ? 3 : 0,
          outline: isSelected ? '2px solid #1976d2' : 'none',
          position: 'relative',
          p: 0,
          m: 0.5,
          transition: 'box-shadow 0.2s',
          '&:focus': {
            outline: '2px solid #1976d2',
            zIndex: 2
          }
        }}
        onClick={e => onClick?.(toothNumber, e)}
        onKeyDown={e => {
          if (e.key === 'Enter') onClick?.(toothNumber, e as any);
        }}
      >
        <Box sx={{ position: 'absolute', top: 2, left: 2 }}>
          {plannedCount > 0 && (
            <Badge badgeContent={plannedCount} color="info" variant="standard" />
          )}
        </Box>
        <Box sx={{ position: 'absolute', top: 2, right: 2 }}>
          {completedCount > 0 && (
            <Badge badgeContent={completedCount} color="success" />
          )}
        </Box>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isSelected ? 'rgba(25, 118, 210, 0.1)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: '#333',
            border: '1px solid #ccc',
            position: 'relative'
          }}
        >
          {toothNumber}
        </Box>
        {/* Surface overlays */}
        {surfaces.length > 0 && (
          <Box sx={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
            {surfaces.map(surface => (
              <Button
                key={surface}
                size="small"
                variant="contained"
                color="secondary"
                sx={{ minWidth: 18, minHeight: 18, borderRadius: '50%', p: 0, fontSize: '0.7rem' }}
                aria-label={`Toggle ${surface} surface`}
                onClick={e => {
                  e.stopPropagation();
                  onSurfaceToggle?.(surface);
                }}
              >
                {surface}
              </Button>
            ))}
          </Box>
        )}
      </Button>
    </Tooltip>
  );
};

export default Tooth;
