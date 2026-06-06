export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-label">Materials and references</p>
          <p>
            Code, method and data:{" "}
            <a
              href="https://github.com/JosephBARBIERDARNAL/pacific-dataviz-challenge"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>
          </p>
          <p>
            Author:{" "}
            <a
              href="https://barbierjoseph.com/"
              target="_blank"
              rel="noreferrer"
            >
              Joseph Barbier
            </a>
          </p>
        </div>
        <img
          className="footer-logo"
          src={`${import.meta.env.BASE_URL}image/logo.png`}
          alt="Pacific Dataviz Challenge"
        />
      </div>
    </footer>
  );
}
