import { Spinner } from "@/components/ui/shadcn-io/spinner";
import "@/index.css";
import { mountWidget } from "skybridge/web";
import { useToolInfo } from "../helpers";

interface Dataset {
  id: string;
  title: string;
  description: string;
  organization: string;
  url: string;
  last_modified: string;
  resources_count: number;
}

function SearchDatasetsWidget() {
  const toolInfo = useToolInfo<"search-datasets">();

  const output = toolInfo.output;

  if (!output) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner />
      </div>
    );
  }

  const { datasets, total, query } = output;

  return (
    <div className="p-4 font-sans">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          {total} résultats pour "{query}"
        </h2>
        <p className="text-sm text-gray-500">
          Données publiques françaises sur data.gouv.fr
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {datasets.map((dataset: Dataset) => (
          <a
            key={dataset.id}
            href={dataset.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all bg-white"
          >
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-semibold text-blue-700 hover:text-blue-800 line-clamp-2">
                {dataset.title}
              </h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">
                {dataset.resources_count} ressource
                {dataset.resources_count > 1 ? "s" : ""}
              </span>
            </div>

            <p className="text-sm text-gray-600 mt-1">{dataset.organization}</p>

            {dataset.description && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {dataset.description}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              ID: <code className="bg-gray-100 px-1 rounded">{dataset.id}</code>
            </p>
          </a>
        ))}
      </div>

      <a
        href={`https://www.data.gouv.fr/fr/datasets/?q=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 text-blue-600 hover:text-blue-800 text-sm"
      >
        Voir tous les résultats sur data.gouv.fr →
      </a>
    </div>
  );
}

export default SearchDatasetsWidget;

mountWidget(<SearchDatasetsWidget />);
