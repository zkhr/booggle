import type React from "react";
import type { User } from "../../common/types.ts";
import BooPicker from "../components/BooPicker.tsx";
import "./LoginPage.css";

interface LoginPageProps {
  user: User;
  onJoin: () => void;
  onNickChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function LoginPage(
  { user, onJoin, onNickChange, onColorChange }: LoginPageProps,
) {
  return (
    <div className="page login-page">
      <div className="title">Booggle</div>
      <div className="section">
        <div className="section-title">Enter your name</div>
        <div>
          <input
            className="textinput"
            type="text"
            value={user.nick}
            onChange={onNickChange}
          />
        </div>
      </div>
      <div className="section">
        <div className="section-title">Select a color</div>
        <BooPicker color={user.color} onColorChange={onColorChange} />
      </div>
      <div className="section">
        <button className="button" onClick={onJoin} type="button">
          Join game
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
