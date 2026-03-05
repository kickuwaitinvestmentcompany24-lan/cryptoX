import React from "react";

const tickers = [
  { symbol: "BTC", price: "$67,842.50", change: "+2.4%", positive: true },
  { symbol: "ETH", price: "$3,521.18", change: "+1.8%", positive: true },
  { symbol: "SOL", price: "$178.92", change: "-0.6%", positive: false },
  { symbol: "BNB", price: "$612.30", change: "+3.1%", positive: true },
  { symbol: "XRP", price: "$0.6234", change: "+0.9%", positive: true },
  { symbol: "ADA", price: "$0.4821", change: "-1.2%", positive: false },
  { symbol: "DOGE", price: "$0.1542", change: "+5.3%", positive: true },
  { symbol: "AVAX", price: "$38.62", change: "+2.1%", positive: true },
];

const TickerMarquee = () => {
  const items = [...tickers, ...tickers];

  return (
    <div className="w-full overflow-hidden border-b border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 mx-6 text-xs">
            <span className="font-medium text-foreground">{t.symbol}</span>
            <span className="text-muted-foreground">{t.price}</span>
            <span className={t.positive ? "text-primary" : "text-destructive"}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TickerMarquee;
