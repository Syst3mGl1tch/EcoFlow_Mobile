import Svg, { Path, G } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  veinColor?: string;
};

export default function LeafIcon({ size = 80, color = '#16B357', veinColor }: Props) {
  const veins = veinColor ?? '#F2F0DC';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform="rotate(-30, 50, 50)">
        {/* Folha alongada e simétrica */}
        <Path
          d="M 50 8 C 70 20, 74 50, 50 82 C 26 50, 30 20, 50 8 Z"
          fill={color}
        />
        {/* Nervura central */}
        <Path
          d="M 50 14 L 50 78"
          stroke={veins}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Nervuras laterais direitas */}
        <Path d="M 50 32 Q 62 36, 66 32" stroke={veins} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <Path d="M 50 46 Q 63 51, 67 47" stroke={veins} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <Path d="M 50 60 Q 60 65, 63 62" stroke={veins} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Nervuras laterais esquerdas */}
        <Path d="M 50 32 Q 38 36, 34 32" stroke={veins} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <Path d="M 50 46 Q 37 51, 33 47" stroke={veins} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <Path d="M 50 60 Q 40 65, 37 62" stroke={veins} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Haste */}
        <Path
          d="M 50 82 Q 52 92, 48 98"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </Svg>
  );
}
