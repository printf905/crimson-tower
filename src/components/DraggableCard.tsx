import { useRef, useState, useCallback, CSSProperties } from 'react';
import CardComponent from './CardComponent';
import { Card } from '../types/game';

interface Props {
  card: Card;
  fanRotate: number;       // degrees from fan layout
  fanOffsetY: number;      // px down from fan curvature
  index: number;
  handLength: number;
  canPlay: boolean;
  isPlayerTurn: boolean;
  energy: number;
  onPlay: (card: Card) => void;
  onSelect: (card: Card) => void;
  selected: boolean;
}

// How many px above the hand area the pointer must travel to trigger a play
const PLAY_THRESHOLD = 140;

export default function DraggableCard({
  card, fanRotate, fanOffsetY, index, handLength,
  canPlay, isPlayerTurn, energy, onPlay, onSelect, selected,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [snapping, setSnapping] = useState(false);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  const cost = card.cost < 0 ? energy : card.cost;
  const playable = isPlayerTurn && energy >= cost;

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPlayerTurn || !playable) return;
    // Ignore right click
    if (e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    startPos.current = { x: e.clientX, y: e.clientY };
    playedRef.current = false;
    setDragging(false);
  }, [isPlayerTurn, playable]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6) {
      setDragging(true);
      setSnapping(false);
      setDragDelta({ x: dx, y: dy });
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return;

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const movedEnough = Math.sqrt(dx * dx + dy * dy) > 6;

    if (dragging && dy < -PLAY_THRESHOLD && playable) {
      // Play the card
      playedRef.current = true;
      setDragging(false);
      setDragDelta({ x: 0, y: 0 });
      startPos.current = null;
      onPlay(card);
    } else if (dragging) {
      // Snap back
      setSnapping(true);
      setDragging(false);
      setDragDelta({ x: 0, y: 0 });
      startPos.current = null;
      setTimeout(() => setSnapping(false), 380);
    } else if (!movedEnough && isPlayerTurn) {
      // Treat as click — select
      setDragging(false);
      startPos.current = null;
      onSelect(card);
    } else {
      setDragging(false);
      startPos.current = null;
    }
  }, [dragging, card, playable, isPlayerTurn, onPlay, onSelect]);

  const onPointerCancel = useCallback(() => {
    if (dragging) {
      setSnapping(true);
      setTimeout(() => setSnapping(false), 380);
    }
    setDragging(false);
    setDragDelta({ x: 0, y: 0 });
    startPos.current = null;
  }, [dragging]);

  // Dynamic tilt while dragging based on horizontal velocity
  const tiltDeg = dragging ? Math.max(-18, Math.min(18, dragDelta.x * 0.12)) : 0;

  // How "ready to play" — normalize between 0 and 1 based on how far above threshold
  const playReadiness = dragging
    ? Math.max(0, Math.min(1, (-dragDelta.y - 60) / PLAY_THRESHOLD))
    : 0;

  const containerStyle: CSSProperties = {
    position: 'relative',
    transformOrigin: 'bottom center',
    zIndex: dragging ? 200 : hovered ? 100 : selected ? 60 : 10 + index,
    // Fan layout applied here when not dragging
    transform: dragging
      ? `translate(${dragDelta.x}px, ${dragDelta.y}px) rotate(${tiltDeg}deg) scale(1.08)`
      : snapping
      ? undefined
      : selected
      ? `rotate(${fanRotate}deg) translateY(${fanOffsetY - 28}px) scale(1.12)`
      : hovered
      ? `rotate(${fanRotate}deg) translateY(${fanOffsetY - 20}px) scale(1.06)`
      : `rotate(${fanRotate}deg) translateY(${fanOffsetY}px)`,
    transition: dragging ? 'none' : 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1)',
    cursor: playable ? (dragging ? 'grabbing' : 'grab') : 'default',
    filter: dragging
      ? playReadiness > 0.5
        ? `drop-shadow(0 0 16px rgba(${playReadiness > 0.8 ? '74,222,128' : '239,68,68'},${0.5 + playReadiness * 0.5}))`
        : 'drop-shadow(0 0 10px rgba(239,68,68,0.5))'
      : undefined,
  };

  return (
    <div
      ref={cardRef}
      style={containerStyle}
      className={snapping ? 'card-snap-back' : ''}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* "Release to play" hint ring */}
      {dragging && playReadiness > 0.4 && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 0 ${Math.round(playReadiness * 4)}px rgba(74,222,128,${playReadiness * 0.8})`,
            transition: 'box-shadow 0.1s',
          }}
        />
      )}

      <CardComponent
        card={card}
        playable={playable}
        selected={selected}
      />
    </div>
  );
}
