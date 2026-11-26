import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { formatMoney } from '../money';
import { EASE } from '../fx';

type Props = { value: number; currency: string; className?: string; signed?: boolean };

/** A money amount that counts smoothly to its new value whenever it changes. */
export default function AnimatedMoney({ value, currency, className, signed }: Props) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => {
    const s = formatMoney(Math.abs(v), currency);
    if (!signed || Math.abs(v) < 0.005) return s;
    return (v > 0 ? '+' : '−') + s;
  });

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: EASE });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
