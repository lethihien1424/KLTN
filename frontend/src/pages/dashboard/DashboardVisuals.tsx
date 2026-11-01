import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";

import "./chartSetup";
import "../../styles/dashboardBoards.css";

export const colors = [
  "#2878c8",
  "#279b78",
  "#e2a126",
  "#8063c8",
  "#d85a52",
  "#1d9aa6",
  "#dc7b38",
  "#c36b98",
];

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

export const number = (value: number): string =>
  numberFormatter.format(value);

export function finite(value: unknown): number | null {
  if (value == null || value === "") return null;

  const result = Number(value);

  return Number.isFinite(result) ? result : null;
}

export function useBoardData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setData(null);

    Promise.resolve()
      .then(fetcher)
      .then(result => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Không tải được dữ liệu.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetcher, revision]);

  return {
    data,
    error,
    loading,
    reload: () => setRevision(value => value + 1),
  };
}

type BoardResource = {
  loading: boolean;
  error: string;
  reload: () => void;
};

type FrameProps = {
  resource: BoardResource;
  children: ReactNode;
  note?: string;
};

export function Frame({
  resource,
  children,
  note,
}: FrameProps) {
  return (
    <div className="dv-frame">
      <div className="dv-toolbar">
        <p>{note}</p>

        <button
          type="button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          Làm mới
        </button>
      </div>

      {resource.loading ? (
        <p className="dv-state" role="status">
          Đang tải dữ liệu…
        </p>
      ) : resource.error ? (
        <div className="dv-state dv-error" role="alert">
          <span>{resource.error}</span>

          <button
            type="button"
            onClick={resource.reload}
          >
            Thử lại
          </button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

type UnitSelectProps = {
  values: string[];
  selected: string;
  onChange: (value: string) => void;
};

export function UnitSelect({
  values,
  selected,
  onChange,
}: UnitSelectProps) {
  if (!values.length) return null;

  return (
    <label className="dv-field">
      <span>Đơn vị</span>

      <select
        value={selected}
        onChange={event => onChange(event.target.value)}
      >
        {values.map(value => (
          <option key={value} value={value}>
            {value || "Chưa xác định"}
          </option>
        ))}
      </select>
    </label>
  );
}

export function useUnit(values: string[]) {
  const units = [...new Set(values)].sort((a, b) =>
    a.localeCompare(b, "vi"),
  );

  const [chosen, setChosen] = useState("");

  return {
    units,
    unit: units.includes(chosen)
      ? chosen
      : units[0] ?? "",
    setUnit: setChosen,
  };
}

type ChartSeries = {
  label: string;
  values: (number | null)[];
};

type ChartCardProps = {
  title: string;
  note?: string;
  labels: string[];
  series: ChartSeries[];
  kind?: "bar" | "line" | "donut";
  horizontal?: boolean;
  percent?: boolean;
};

function formatChartValue(
  value: unknown,
  percent: boolean,
): string {
  const parsed = finite(value);

  if (parsed == null) return "—";

  return `${number(parsed)}${percent ? "%" : ""}`;
}

export function ChartCard({
  title,
  note,
  labels,
  series,
  kind = "bar",
  horizontal = false,
  percent = false,
}: ChartCardProps) {
  const id = useId();

  const hasData =
    labels.length > 0 &&
    series.some(item =>
      item.values.some(
        value =>
          value != null &&
          Number.isFinite(value),
      ),
    );

  const hasDonutData = (
    series[0]?.values ?? []
  ).some(
    value =>
      value != null &&
      Number.isFinite(value) &&
      value > 0,
  );

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: context =>
            `${context.dataset.label ?? ""}: ${formatChartValue(
              context.raw,
              percent,
            )}`,
        },
      },
    },
    scales: horizontal
      ? {
          x: {
            beginAtZero: true,
            ...(percent
              ? { suggestedMax: 100 }
              : {}),
            ticks: {
              callback: value =>
                formatChartValue(value, percent),
            },
          },
          y: {
            grid: {
              display: false,
            },
          },
        }
      : {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            ...(percent
              ? { suggestedMax: 100 }
              : {}),
            ticks: {
              callback: value =>
                formatChartValue(value, percent),
            },
          },
        },
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: context =>
            `${context.dataset.label ?? ""}: ${formatChartValue(
              context.raw,
              percent,
            )}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ...(percent
          ? { suggestedMax: 100 }
          : {}),
        ticks: {
          callback: value =>
            formatChartValue(value, percent),
        },
      },
    },
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: context =>
            `${context.label}: ${formatChartValue(
              context.raw,
              percent,
            )}`,
        },
      },
    },
  };

  const datasets = series.map((item, index) => ({
    label: item.label,
    data: item.values.map(value =>
      value != null && Number.isFinite(value)
        ? value
        : null,
    ),
    backgroundColor:
      colors[index % colors.length],
    borderColor:
      colors[index % colors.length],
    borderWidth: 2,
  }));

  const empty =
    !hasData ||
    (kind === "donut" && !hasDonutData);

  return (
    <article
      className="dv-chart"
      aria-labelledby={id}
    >
      <header>
        <h3 id={id}>{title}</h3>
        {note && <p>{note}</p>}
      </header>

      {empty ? (
        <p className="dv-state" role="status">
          Chưa có dữ liệu phù hợp.
        </p>
      ) : (
        <div className="dv-canvas">
          {kind === "donut" ? (
            <Doughnut
              data={{
                labels,
                datasets: [
                  {
                    label: series[0]?.label ?? "",
                    data: (
                      series[0]?.values ?? []
                    ).map(value =>
                      value != null &&
                      Number.isFinite(value) &&
                      value > 0
                        ? value
                        : 0,
                    ),
                    backgroundColor: labels.map(
                      (_, index) =>
                        colors[
                          index % colors.length
                        ],
                    ),
                    borderColor: "#ffffff",
                    borderWidth: 2,
                  },
                ],
              }}
              options={doughnutOptions}
              role="img"
              aria-label={title}
            />
          ) : kind === "line" ? (
            <Line
              data={{
                labels,
                datasets: datasets.map(item => ({
                  ...item,
                  tension: 0.25,
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  spanGaps: false,
                })),
              }}
              options={lineOptions}
              role="img"
              aria-label={title}
            />
          ) : (
            <Bar
              data={{
                labels,
                datasets: datasets.map(item => ({
                  ...item,
                  borderWidth: 0,
                  borderRadius: 4,
                  maxBarThickness: 36,
                })),
              }}
              options={barOptions}
              role="img"
              aria-label={title}
            />
          )}
        </div>
      )}
    </article>
  );
}