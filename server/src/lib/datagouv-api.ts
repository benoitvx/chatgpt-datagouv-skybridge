const DATAGOUV_API_BASE = "https://www.data.gouv.fr/api/1";
const TABULAR_API_BASE = "https://tabular-api.data.gouv.fr/api/resources";

// ============ Types ============

export interface DatasetResult {
  id: string;
  title: string;
  description: string;
  organization: string;
  url: string;
  last_modified: string;
  resources_count: number;
}

export interface SearchResult {
  datasets: DatasetResult[];
  total: number;
  query: string;
}

export interface Resource {
  id: string;
  title: string;
  format: string;
  url: string;
}

export interface DatasetInfo {
  id: string;
  title: string;
  last_modified: string;
  resources: Resource[];
}

export interface TabularRow {
  [key: string]: unknown;
}

export interface ResourceSchema {
  id: string;
  title: string;
  format: string;
  columns: string[];
}

export interface DatasetSchema {
  dataset_id: string;
  title: string;
  resources: ResourceSchema[];
}

export interface TabularResult {
  data: TabularRow[];
  meta: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface ChartData {
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

// ============ Search Datasets ============

export async function searchDatasets(
  query: string,
  pageSize: number = 5
): Promise<SearchResult> {
  const url = new URL(`${DATAGOUV_API_BASE}/datasets/`);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(pageSize));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const datasets: DatasetResult[] = data.data.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description?.slice(0, 200) ?? "",
    organization: d.organization?.name ?? "Inconnu",
    url: d.page,
    last_modified: d.last_modified,
    resources_count: d.resources?.length ?? 0,
  }));

  return {
    datasets,
    total: data.total,
    query,
  };
}

// ============ Get Dataset Resources ============

export async function getDatasetResources(
  datasetId: string
): Promise<DatasetInfo> {
  const url = `${DATAGOUV_API_BASE}/datasets/${datasetId}/`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Dataset not found: ${datasetId}`);
  }

  const data = await response.json();

  const resources: Resource[] = (data.resources ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? "Sans titre",
    format: r.format?.toLowerCase() ?? "",
    url: r.url,
  }));

  return {
    id: data.id,
    title: data.title,
    last_modified: data.last_modified,
    resources,
  };
}

// ============ Query Tabular Data ============

export async function queryTabularData(
  resourceId: string,
  limit: number = 20
): Promise<TabularResult> {
  const url = new URL(`${TABULAR_API_BASE}/${resourceId}/data/`);
  url.searchParams.set("page_size", String(limit));

  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Ressource non disponible dans l'API Tabular: ${resourceId}`
      );
    }
    throw new Error(`Tabular API error: ${response.status}`);
  }

  const result = await response.json();

  return {
    data: result.data ?? [],
    meta: {
      total: result.meta?.total ?? 0,
      page: result.meta?.page ?? 1,
      page_size: result.meta?.page_size ?? limit,
    },
  };
}

// ============ Query Dataset (combines both) ============

export async function queryDataset(
  datasetId: string,
  columns: string[],
  resourceId?: string,
  limit: number = 20
): Promise<ChartData> {
  const datasetInfo = await getDatasetResources(datasetId);

  let actualResourceId = resourceId;

  if (!actualResourceId) {
    const tabularResource = datasetInfo.resources.find(
      (r) => r.format === "csv" || r.format === "parquet"
    );

    if (!tabularResource) {
      throw new Error(
        `Aucune ressource CSV/Parquet trouvée pour le dataset: ${datasetId}`
      );
    }

    actualResourceId = tabularResource.id;
  }

  const tabularResult = await queryTabularData(actualResourceId, limit);

  const [labelColumn, valueColumn] = columns;

  if (!labelColumn || !valueColumn) {
    throw new Error("Deux colonnes requises: [labelColumn, valueColumn]");
  }

  const labels: string[] = [];
  const values: number[] = [];

  for (const row of tabularResult.data) {
    const labelValue = row[labelColumn];
    const numValue = row[valueColumn];

    if (labelValue !== undefined && numValue !== undefined) {
      labels.push(String(labelValue));
      values.push(Number(numValue) || 0);
    }
  }

  return {
    title: datasetInfo.title,
    dataset_url: `https://www.data.gouv.fr/fr/datasets/${datasetId}/`,
    chart: {
      type: "bar",
      labels,
      values,
      label: valueColumn,
    },
    source: {
      dataset_id: datasetId,
      resource_id: actualResourceId,
      last_modified: datasetInfo.last_modified,
    },
  };
}

// ============ Get Resource Profile (columns) ============

export async function getResourceProfile(
  resourceId: string
): Promise<string[]> {
  const url = `${TABULAR_API_BASE}/${resourceId}/profile/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.profile && Array.isArray(data.profile)) {
      return data.profile.map((col: any) => col.name).filter(Boolean);
    }

    if (data.columns && Array.isArray(data.columns)) {
      return data.columns.map((col: any) => col.name || col).filter(Boolean);
    }

    return [];
  } catch {
    return [];
  }
}

// ============ Get Dataset Schema ============

export async function getDatasetSchema(
  datasetId: string
): Promise<DatasetSchema> {
  const datasetInfo = await getDatasetResources(datasetId);

  const resourceSchemas: ResourceSchema[] = [];

  for (const resource of datasetInfo.resources) {
    if (resource.format === "csv" || resource.format === "parquet") {
      const columns = await getResourceProfile(resource.id);

      resourceSchemas.push({
        id: resource.id,
        title: resource.title,
        format: resource.format,
        columns,
      });
    }
  }

  return {
    dataset_id: datasetId,
    title: datasetInfo.title,
    resources: resourceSchemas,
  };
}
