import type React from "react";
import type { User } from "../../common/types.ts";

interface LoginPageProps {
  user: User;
  onJoin: () => void;
  onNickChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBooChange: (e: React.MouseEvent) => void;
}

function LoginPage(
  { user, onJoin, onNickChange, onBooChange }: LoginPageProps,
) {
  const boos = Array.from({ length: 16 }, (_, i) => renderBoo(i + 1, user))
    .concat();

  return (
    <div className="content">
      <div className="title">Welcome to Booggle!</div>
      <div className="inputs">
        <div className="inputwrapper">
          <div>Enter your name</div>
          <div>
            <input
              className="textinput"
              type="text"
              value={user.nick}
              onChange={onNickChange}
            />
          </div>
        </div>
        <div className="inputwrapper" onClick={onBooChange}>
          <div>Select a boo</div>
          {boos}
        </div>
        <div className="inputwrapper">
          <button className="button" onClick={onJoin} type="button">Join</button>
        </div>
      </div>
    </div>
  );
}

function renderBoo(i: number, user: User) {
  const classes = ["boo", "boo-" + i, user.boo === i ? "selected" : ""];
  return <div className={classes.join(" ")} key={i} data-index={i}></div>;
}

export default LoginPage;
