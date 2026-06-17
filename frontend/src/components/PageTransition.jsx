import { motion } from 'framer-motion'

const variants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -6, filter: 'blur(2px)' },
}

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
