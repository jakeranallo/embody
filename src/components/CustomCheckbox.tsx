// CustomCheckbox.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSpring, animated } from 'react-spring';
import { Particles } from 'react-tsparticles';

interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface StyledCheckboxProps {
  checked: boolean;
}

const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
`;

const StyledCheckbox = styled(animated.div)<StyledCheckboxProps>`
  display: inline-block;
  width: 20px;
  height: 20px;
  background: ${props => (props.checked ? '#007BFF' : '#FFF')};
  border: 1px solid #ccc;
  border-radius: 3px;
  transition: background 0.3s;
`;

const CheckboxLabel = styled.span`
  margin-left: 8px;
`;

const ParticleContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const particleOptions = {
  particles: {
    number: {
      value: 50,
    },
    size: {
      value: 3,
    },
    color: {
      value: '#00FF00', // Green color
    },
  },
  interactivity: {
    events: {
      onhover: {
        enable: true,
        mode: 'repulse',
      },
    },
  },
};

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ label, checked, onChange }) => {
  const [showParticles, setShowParticles] = useState(false);

  const springProps = useSpring({
    background: checked ? '#007BFF' : '#FFF',
    onStart: () => {
      if (checked) {
        setShowParticles(true);
      }
    },
    onRest: () => {
      if (!checked) {
        setShowParticles(false);
      }
    },
  });

  const handleCheckboxChange = () => {
    onChange(!checked);
  };

  // Initialize particles when showParticles changes
  useEffect(() => {
    if (showParticles) {
      // Ensure proper initialization and updating of particles
      const tsParticles = window.tsParticles;
      tsParticles.init();
    }
  }, [showParticles]);

  return (
    <CheckboxContainer>
      <HiddenCheckbox checked={checked} onChange={handleCheckboxChange} />
      <StyledCheckbox checked={checked} as={animated.div} style={springProps} />
      <CheckboxLabel>{label}</CheckboxLabel>
      {showParticles && (
        <ParticleContainer>
          <Particles options={particleOptions} />
        </ParticleContainer>
      )}
    </CheckboxContainer>
  );
};

export default CustomCheckbox;
