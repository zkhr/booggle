interface BoardProps {
  letters: string[];
}

function Board({ letters }: BoardProps) {
  const cells = letters.map((letter, i) => renderCell(letter, i)).concat();

  return <div className="board">{cells}</div>;
}

function renderCell(letter: string, index: number) {
  const isQ = letter === "Q";
  return (
    <div className={isQ ? "cell qcell" : "cell"} key={index}>
      {isQ ? "Qu" : letter}
    </div>
  );
}

export default Board;
