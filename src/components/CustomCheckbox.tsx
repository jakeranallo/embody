// CustomCheckbox.tsx
import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useSpring, animated } from "react-spring";
import Particles from "react-particles";
import type { Container, Engine } from "tsparticles-engine";
import { loadConfettiPreset } from "tsparticles-preset-confetti";

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

const HiddenCheckbox = styled.input.attrs({ type: "checkbox" })`
  position: absolute;
  opacity: 0;
  cursor: pointer;
`;

const StyledCheckbox = styled(animated.div)<StyledCheckboxProps>`
  display: inline-block;
  width: 20px;
  height: 20px;
  background: ${(props) => (props.checked ? "#007BFF" : "#FFF")};
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
    preset: "confetti",
};

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
}) => {
  const [showParticles, setShowParticles] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    console.log(engine);

    // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    //await loadFull(engine);
    await loadConfettiPreset(engine);
  }, []);

  const particlesLoaded = useCallback(
    async (container: Container | undefined) => {
      console.log(container);
    },
    []
  );

  const springProps = useSpring({
    background: checked ? "#007BFF" : "#FFF",
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

  return (
    <CheckboxContainer>
      <HiddenCheckbox checked={checked} onChange={handleCheckboxChange} />
      <StyledCheckbox checked={checked} as={animated.div} style={springProps} />
      <CheckboxLabel>{label}</CheckboxLabel>
      {showParticles && (
        <ParticleContainer>
          <Particles
            options={particleOptions}
            init={particlesInit}
            loaded={particlesLoaded}
          />
        </ParticleContainer>
      )}
    </CheckboxContainer>
  );
};

export default CustomCheckbox;
