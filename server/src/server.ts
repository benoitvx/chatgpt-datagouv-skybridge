import { z } from "zod";
import { McpServer } from "skybridge/server";
import {
  searchDatasets,
  queryDataset,
  getDatasetSchema,
} from "./lib/datagouv-api.js";

const server = new McpServer(
  {
    name: "datagouv",
    version: "1.0.0",
  },
  { capabilities: {} }
)
  .registerWidget(
    "search-datasets",
    {
      description: "Liste des jeux de données trouvés sur data.gouv.fr",
    },
    {
      description: `Searches French public datasets on data.gouv.fr.
Returns dataset_id needed for visualization.
WORKFLOW: search-datasets -> get-dataset-schema -> query-dataset
NEXT STEP: Call get-dataset-schema with the dataset_id to discover available columns, then query-dataset to GENERATE A BAR CHART.`,
      inputSchema: {
        query: z.string().min(1).describe("Termes de recherche"),
        page_size: z.number().min(1).max(20).default(5).optional(),
      },
    },
    async ({ query, page_size = 5 }) => {
      try {
        const results = await searchDatasets(query, page_size);

        return {
          structuredContent: {
            datasets: results.datasets,
            total: results.total,
            query,
          },
          content: [
            {
              type: "text",
              text: `${results.total} datasets trouvés pour "${query}". Utilisez get-dataset-schema avec un dataset_id pour découvrir les colonnes disponibles.`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Erreur: ${error}` }],
          isError: true,
        };
      }
    }
  )
  .registerTool(
    "get-dataset-schema",
    {
      description: `DISCOVERS available columns in a dataset. CALL THIS FIRST before query-dataset.
Returns: resource IDs and their column names.
WORKFLOW: search-datasets -> get-dataset-schema -> query-dataset
Use the column names returned to correctly call query-dataset with valid [category, value] columns.`,
      inputSchema: {
        dataset_id: z
          .string()
          .describe("ID du dataset data.gouv.fr (from search-datasets results)"),
      },
    },
    async ({ dataset_id }) => {
      try {
        const schema = await getDatasetSchema(dataset_id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(schema, null, 2),
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Erreur: ${error}` }],
          isError: true,
        };
      }
    }
  )
  .registerWidget(
    "query-dataset",
    {
      description: "Visualisation des données sous forme de graphique",
    },
    {
      description: `GENERATES AN INTERACTIVE BAR CHART from French public data.
WORKFLOW: search-datasets -> get-dataset-schema -> query-dataset
IMPORTANT: Call get-dataset-schema FIRST to discover available column names!
USE THIS TOOL when user wants to: visualize, compare, show trends, display statistics, create a chart, or see data graphically.
Returns structured data that renders as an interactive bar chart widget.
Requires: dataset_id, columns [category_column, value_column] - use EXACT column names from get-dataset-schema.`,
      inputSchema: {
        dataset_id: z.string().describe("ID du dataset data.gouv.fr"),
        resource_id: z
          .string()
          .optional()
          .describe(
            "ID de la ressource (optionnel, prend la première par défaut)"
          ),
        columns: z
          .array(z.string())
          .describe("Colonnes à récupérer [catégorie, valeur]"),
        limit: z.number().min(1).max(50).default(20).optional(),
      },
    },
    async ({ dataset_id, resource_id, columns, limit = 20 }) => {
      try {
        const chartData = await queryDataset(
          dataset_id,
          columns,
          resource_id,
          limit
        );

        return {
          structuredContent: chartData,
          content: [
            {
              type: "text",
              text: `Graphique généré: ${chartData.title} (${chartData.chart.labels.length} points de données)`,
            },
          ],
          isError: false,
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Erreur: ${error}` }],
          isError: true,
        };
      }
    }
  );

export default server;
export type AppType = typeof server;
