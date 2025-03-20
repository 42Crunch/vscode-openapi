declare namespace Chart {
  type ScriptableContext = {
    chart?: Chart;
    dataIndex?: number;
    dataset?: Chart.ChartDataSets;
    datasetIndex?: number;
  };

  export interface MetaData {
    _chart: Chart;
    _datasetIndex: number;
    _index: number;
    _model: any;
    _start?: any;
    _view: any;
    _xScale: Chart.ChartScales;
    _yScale: Chart.ChartScales;
    hidden?: boolean;
  }
}
