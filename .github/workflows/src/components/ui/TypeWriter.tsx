import React, { useState, useEffect, useRef } from 'react';

interface TypeWriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onStop?: () => void;
}

export const TypeWriter: React.FC<TypeWriterProps> = ({ 
  text, 
  speed = 5,
  onComplete,
  onStop 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStopped, setIsStopped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, [displayedText]);

  useEffect(() => {
    if (isStopped) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (onComplete) onComplete();
      return;
    }

    if (currentIndex < text.length) {
      const isCodeBlock = text.slice(currentIndex).startsWith('```');
      const currentSpeed = isCodeBlock ? speed / 2 : speed;

      const chunkSize = isCodeBlock ? 10 : 3;
      
      const timeout = setTimeout(() => {
        const nextChunk = text.slice(currentIndex, currentIndex + chunkSize);
        setDisplayedText(prev => prev + nextChunk);
        setCurrentIndex(prev => Math.min(prev + chunkSize, text.length));
      }, currentSpeed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isStopped]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsStopped(false);
  }, [text]);

  const handleStop = () => {
    setIsStopped(true);
    if (onStop) onStop();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="whitespace-pre-wrap">
        {displayedText}
        {currentIndex < text.length && !isStopped && (
          <span className="animate-pulse">▋</span>
        )}
      </div>
    </div>
  );
}; 