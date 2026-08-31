import React from 'react';

interface FamiliaHadidaLogoProps {
  className?: string;
}

export const FamiliaHadidaLogo: React.FC<FamiliaHadidaLogoProps> = ({
  className = 'h-14 sm:h-16 md:h-18 w-auto',
}) => {
  return (
    <img
      src="/logo.png"
      alt="Familia Hadida"
      className={`object-contain select-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
