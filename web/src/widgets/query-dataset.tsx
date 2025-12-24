import { Spinner } from "@/components/ui/shadcn-io/spinner";
import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo } from "../helpers";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  title: string;
  dataset_url: string;
  chart: {
    type: "bar";
    labels: string[];
    values: number[];
    label: string;
  };
  source: {
    dataset_id: string;
    resource_id: string;
    last_modified: string;
  };
}

function QueryDatasetWidget() {
  const toolInfo = useToolInfo<"query-dataset">();

  const output = toolInfo.output as ChartData | null;

  if (!output) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  const chartData = {
    labels: output.chart.labels,
    datasets: [
      {
        label: output.chart.label,
        data: output.chart.values,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: output.title,
        font: {
          size: 14,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-4 font-sans bg-white rounded-lg">
      <div className="h-64 mb-4">
        <Bar data={chartData} options={options} />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
        <div>
          <span className="font-medium">Source:</span>{" "}
          <a
            href={output.dataset_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            data.gouv.fr
          </a>
        </div>
        <div>
          Mis à jour:{" "}
          {new Date(output.source.last_modified).toLocaleDateString("fr-FR")}
        </div>
      </div>
    </div>
  );
}

export default QueryDatasetWidget;

mountWidget(<QueryDatasetWidget />);
