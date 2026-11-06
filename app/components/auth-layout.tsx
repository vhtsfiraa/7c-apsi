import Image from "next/image";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  variant?: "landing" | "login" | "register";
};

const assets = "/design-assets";

export function AuthLayout({ children, variant = "login" }: AuthLayoutProps) {
  return (
    <main
      className={`login-screen auth-screen auth-screen--${variant}`}
      data-node-id="218:51"
    >
      <div className="login-art" aria-hidden="true">
        <Image
          alt=""
          className="art-gradient art-gradient-top"
          height={873}
          src={`${assets}/background-top.svg`}
          width={897}
        />
        <Image
          alt=""
          className="art-gradient art-gradient-top art-gradient-top-copy"
          height={873}
          src={`${assets}/background-top.svg`}
          width={897}
        />
        <Image
          alt=""
          className="art-gradient art-gradient-bottom"
          height={717}
          src={`${assets}/background-bottom.svg`}
          width={769}
        />
        <Image
          alt=""
          className="art-gradient art-gradient-side"
          height={762}
          src={`${assets}/background-side.svg`}
          width={886}
        />
        <Image
          alt=""
          className="art-gradient art-gradient-side art-gradient-side-copy"
          height={762}
          src={`${assets}/background-side.svg`}
          width={886}
        />
        <Image
          alt=""
          className="washer-image"
          height={761}
          src={`${assets}/washer-laundry.png`}
          width={761}
        />
        <Image
          alt=""
          className="art-logo"
          height={93}
          src={`${assets}/washer-logo.png`}
          width={93}
        />
      </div>

      <section
        aria-label={variant === "register" ? "Daftar Member" : "Login"}
        className="login-panel"
        data-node-id="218:52"
      >
        <Image
          alt=""
          aria-hidden="true"
          className="panel-wave"
          height={614}
          src={`${assets}/panel-wave.svg`}
          width={689}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="panel-glow"
          height={710}
          src={`${assets}/panel-glow.svg`}
          width={854}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="panel-logo"
          height={238}
          src={`${assets}/washer-logo.png`}
          width={238}
        />
        <div
          className={`login-content auth-content${variant === "register" ? " auth-content--register" : variant === "landing" ? " auth-content--landing" : ""}`}
        >
          {variant === "landing" ? (
            <h1 className="brand-title landing-brand" data-node-id="137:35">
              <span className="landing-welcome">Hai! Selamat datang</span>
              <span>Job Laundry</span>
            </h1>
          ) : (
            <h1 className="brand-title" data-node-id="218:56">
              Job
              <br />
              Laundry
            </h1>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}
