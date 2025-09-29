# plot_prefecture_map.ipynb

## 概要
`plot_prefecture_map.ipynb` は、日本の都道府県ごとの統計データを **コロプレス地図（Choropleth Map）** として可視化する Jupyter Notebook です。  

国土数値情報の **市区町村境界 GeoJSON** と、総務省統計局の **社会生活統計指標（CSV）** を結合し、人口増減率・転入率などのデータを地図上にインタラクティブに表示できます。

---

## 必要環境
- Python 3.8 以上
- Jupyter Notebook または Google Colab

### 必要なライブラリ
```bash
pip install pandas folium geopandas
````

---

## ファイル構成

```
project-root/
├── plot_prefecture_map.ipynb                # 本ノートブック
├── Social_life_statistics_index.csv  # 社会生活統計指標のCSV
├── N03-XX_YY_YYYYMMDD.geojson  # 都道府県の市区町村境界データ
```

* **GeoJSON ファイル**
  国土数値情報ダウンロードサービスで入手可能。
  例：`N03-20_27_200101.geojson`（大阪府）

* **CSV ファイル**
  総務省統計局が公開する「社会生活統計指標」を整形したデータ。
  市区町村コード（`N03_007` に対応）を持ち、各種統計項目を含む。

---

## コード構成と役割

### 1. ライブラリの読み込み

```python
import pandas as pd
import folium
import geopandas as gpd
```

### 2. データの読み込み

```python
# 統計データ
osaka_data = pd.read_csv('Social_life_statistics_index.csv', header=0)

# GeoJSON データ（例：大阪府）
Osaka_geojson = 'C:/Users/.../osaka/N03-20_27_200101.geojson'
```

### 3. 地図の初期化

```python
# 大阪府吹田市を中心に表示
suita_location = [34.7614, 135.5159]

m = folium.Map(
    location=suita_location,
    tiles='cartodbpositron',
    zoom_start=10
)
```

### 4. コロプレスマップの作成

```python
folium.Choropleth(
    geo_data=Osaka_geojson,
    name='choropleth',
    data=osaka_data,
    columns=['市区町村コード', '人口増減率'],
    key_on='feature.properties.N03_007',
    fill_color='YlGnBu',
    fill_opacity=0.7,
    line_opacity=0.2,
    legend_name='人口増減率 (%)'
).add_to(m)
```

### 5. 出力

```python
# Notebook 上に表示
m

# HTML ファイルとして保存
m.save('osaka_population_map.html')
```

---

## 実行方法

1. `plot_prefecture_map.ipynb` を Jupyter Notebook / Colab で開く
2. `GeoJSON` ファイルのパスを対象都道府県のものに変更
3. `data` の列名を可視化したい統計指標（例：人口増減率、転入率）に変更
4. セルを順に実行すると、Notebook 上に地図が描画される

---

## 出力例

* 大阪府の市区町村ごとの人口増減率マップ
* 山梨県の市区町村ごとの転入率マップ


---


## 拡張アイデア

* 都道府県を選択できる UI（ドロップダウンなど）の追加
* 複数年度データを用いたアニメーション表示
* 統計データの自動ダウンロードと前処理の組込み

---

## ⚠️注意
現在(2025/9/29)のコードは一部の都道府県の令和３年のGeoJSONファイルでは動きません。(例：千葉、福岡）

