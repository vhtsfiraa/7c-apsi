import Image from "next/image";

const assets = "/design-assets";

export default function Home() {
  return (
    <main className="login-screen" data-node-id="218:51">
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
        aria-label="Member sign in"
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

        <div className="login-content">
          <h1 className="brand-title" data-node-id="218:56">
            Job
            <br />
            Laundry
          </h1>

          <section aria-labelledby="login-title" className="login-form">
            <h2 className="login-title" id="login-title" data-node-id="218:64">
              Masuk
            </h2>

            <div className="fields">
              <label className="field" htmlFor="username">
                <span>Username</span>
                <input
                  autoComplete="username"
                  id="username"
                  name="username"
                  placeholder="Masukkan username"
                  type="text"
                />
              </label>

              <label className="field" htmlFor="password">
                <span>Password</span>
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  placeholder="Masukkan password"
                  type="password"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="recovery-action" type="button">
                Recovery Password
              </button>
              <button
                className="login-action"
                data-node-id="218:62"
                disabled
                type="button"
              >
                Masuk
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
