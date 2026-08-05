export const TopBar = ({
  channelCode,
  connected,
}: {
  readonly channelCode?: string;
  readonly connected?: boolean;
}) => (
  <div className="topbar">
    <a className="wordmark" href="/" aria-label="IronMON Live home">
      IRONMON<span>LIVE</span>
    </a>
    {channelCode && (
      <div className="topbar-right">
        <span className={`badge ${connected ? "badge-live" : "badge-warning"}`}>
          {connected ? "Live" : "Reconnecting"}
        </span>
        <div className="channel-chip">
          <span className="channel-label">CH</span>
          <span className="channel-code">{channelCode}</span>
        </div>
      </div>
    )}
  </div>
);
