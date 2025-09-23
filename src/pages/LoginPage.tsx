import type React from "react";
import type { User, Theme } from "../../common/types.ts";
import BooPicker from "../components/BooPicker.tsx";
import "./LoginPage.css";

interface LoginPageProps {
  user: User;
  theme: Theme;
  onJoin: () => void;
  onNickChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onThemeChange: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function LoginPage(
  { user, theme, onJoin, onNickChange, onColorChange, onThemeChange }: LoginPageProps,
) {
  return (
    <div className="page login-page">
      <div className="title-row">
        <div className="title">Booggle</div>
        <div className="theme-buttons">
          <button
            className={"theme-button" + (theme === "Light" ? " selected" : "")}
            onClick={onThemeChange}
            type="button"
            value="Light"
          >
            {lightModeIcon()}
          </button>
          <button
            className={"theme-button" + (theme === "Dark" ? " selected" : "")}
            onClick={onThemeChange}
            type="button"
            value="Dark"
          >
            {darkModeIcon()}
          </button>
          <button
            className={"theme-button" + (theme === "Rainbow" ? " selected" : "")}
            onClick={onThemeChange}
            type="button"
            value="Rainbow"
          >
            {rainbowModeIcon()}
          </button>
        </div>
      </div>
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

function lightModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
    >
      <path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z" />
    </svg>
  );
}

function darkModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
    >
      <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z" />
    </svg>
  );
}

function rainbowModeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
    >
      <path d="M40-280q0-91 34.5-171T169-591q60-60 140-94.5T480-720q91 0 171 34.5T791-591q60 60 94.5 140T920-280h-80q0-149-105.5-254.5T480-640q-149 0-254.5 105.5T120-280H40Zm160 0q0-116 82-198t198-82q116 0 198 82t82 198h-80q0-83-58.5-141.5T480-480q-83 0-141.5 58.5T280-280h-80Z" />
    </svg>
  );
}

export default LoginPage;
