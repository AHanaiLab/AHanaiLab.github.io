// Assets/Editor/OekakiGalleryBuilder.cs
// 変換済みの作品(works.json)から、額縁を並べて、作品の絵と説明板(タイトル・作者・コメント)を貼る。
// Unity のメニュー「Oekaki > ギャラリーを作る」から開く。エディタ専用なので、ワールドには含まれない。
#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

public class OekakiGalleryBuilder : EditorWindow
{
    [Serializable] class Work { public string id, title, nickname, comment, art, plate, model, submitted_at; public float aspect; }
    [Serializable] class WorkList { public Work[] works; }

    const string RootName = "OekakiGallery";

    string worksFolder = "Assets/OekakiWorks";   // works.json と Works フォルダを入れた場所
    GameObject framePrefab;                      // 子に Picture と Plate(どちらも Quad)を持つ額縁
    Material baseMaterial;                       // 絵と説明板に使う材質の元(Unlit など、ワールドで使えるもの)
    Transform slotsParent;                       // 空なら、下の「一列に並べる」設定で並べる。指定すると、その子の位置に1つずつ飾る
    float pictureHeight = 1.0f;                  // 絵の高さ(m)。横幅は、絵の縦横比で決まる
    float plateWidth = 0.8f;                     // 説明板の横幅(m)。縦は、その半分
    float frameMargin = 0.05f;                   // 絵のまわりの額縁の太さ(m)。子に Frame があれば、その大きさを合わせる
    float plateGap = 0.08f;                      // 絵と説明板のあいだ(m)
    Vector3 startPosition = Vector3.zero;        // 一列に並べるときの、最初の位置
    Vector3 step = new Vector3(2.5f, 0f, 0f);    // 次の作品との間隔
    Vector3 rotationEuler = Vector3.zero;        // 向き(Z軸が壁の方向)
    int maxTextureSize = 1024;

    [MenuItem("Oekaki/ギャラリーを作る")]
    static void Open() { GetWindow<OekakiGalleryBuilder>("Oekaki ギャラリー"); }

    void OnGUI()
    {
        EditorGUILayout.LabelField("材料", EditorStyles.boldLabel);
        worksFolder = EditorGUILayout.TextField("作品のフォルダ", worksFolder);
        framePrefab = (GameObject)EditorGUILayout.ObjectField("額縁のプレハブ", framePrefab, typeof(GameObject), false);
        baseMaterial = (Material)EditorGUILayout.ObjectField("材質の元", baseMaterial, typeof(Material), false);

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("大きさ", EditorStyles.boldLabel);
        pictureHeight = EditorGUILayout.FloatField("絵の高さ(m)", pictureHeight);
        plateWidth = EditorGUILayout.FloatField("説明板の横幅(m)", plateWidth);
        frameMargin = EditorGUILayout.FloatField("額縁の太さ(m)", frameMargin);
        plateGap = EditorGUILayout.FloatField("絵と説明板のあいだ(m)", plateGap);
        maxTextureSize = EditorGUILayout.IntPopup("画像の最大サイズ", maxTextureSize,
            new[] { "512", "1024", "2048" }, new[] { 512, 1024, 2048 });

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("置き場所", EditorStyles.boldLabel);
        slotsParent = (Transform)EditorGUILayout.ObjectField("置き場所の親(任意)", slotsParent, typeof(Transform), true);
        if (slotsParent == null)
        {
            startPosition = EditorGUILayout.Vector3Field("最初の位置", startPosition);
            step = EditorGUILayout.Vector3Field("次との間隔", step);
            rotationEuler = EditorGUILayout.Vector3Field("向き", rotationEuler);
        }
        else
        {
            EditorGUILayout.HelpBox("親の子を、上から順に「置き場所」として使います。子の青い矢印(Z軸)が、壁の方向を向くように置いてください。" +
                                    "作品の数より置き場所が少ないと、足りない分は作られません。", MessageType.Info);
        }

        EditorGUILayout.Space();
        using (new EditorGUI.DisabledScope(framePrefab == null || baseMaterial == null))
        {
            if (GUILayout.Button("ギャラリーを作る(作り直す)", GUILayout.Height(32))) Build();
        }
    }

    void Build()
    {
        AssetDatabase.Refresh();   // コピーしたばかりのファイルを、先に取り込む
        string jsonPath = worksFolder + "/works.json";
        if (!File.Exists(jsonPath)) { EditorUtility.DisplayDialog("Oekaki", jsonPath + " が見つかりません。", "OK"); return; }
        var list = JsonUtility.FromJson<WorkList>(File.ReadAllText(jsonPath));
        if (list == null || list.works == null || list.works.Length == 0) { EditorUtility.DisplayDialog("Oekaki", "作品がありません。", "OK"); return; }

        var old = GameObject.Find(RootName);
        if (old != null) Undo.DestroyObjectImmediate(old);   // 作り直し
        var root = new GameObject(RootName);
        Undo.RegisterCreatedObjectUndo(root, "Oekaki ギャラリーを作る");

        int made = 0, skipped = 0;
        try
        {
            AssetDatabase.StartAssetEditing();   // 画像の取り込みを、まとめて行う
            foreach (var w in list.works) { SetupTexture(worksFolder + "/" + w.art); SetupTexture(worksFolder + "/" + w.plate); }
        }
        finally { AssetDatabase.StopAssetEditing(); }
        AssetDatabase.Refresh();

        for (int i = 0; i < list.works.Length; i++)
        {
            var w = list.works[i];
            if (slotsParent != null && i >= slotsParent.childCount) { skipped++; continue; }

            Vector3 pos; Quaternion rot;
            if (slotsParent != null) { var s = slotsParent.GetChild(i); pos = s.position; rot = s.rotation; }
            else { pos = startPosition + step * i; rot = Quaternion.Euler(rotationEuler); }

            var go = (GameObject)PrefabUtility.InstantiatePrefab(framePrefab, root.transform);
            go.name = string.Format("Work_{0:000}_{1}", i + 1, w.id);
            go.transform.SetPositionAndRotation(pos, rot);

            float aspect = w.aspect > 0f ? w.aspect : 1f;
            float picW = pictureHeight * aspect, picH = pictureHeight, plateH = plateWidth * 0.5f;

            var pic = go.transform.Find("Picture");
            if (pic != null)
            {
                pic.localScale = new Vector3(picW, picH, 1f);
                Apply(pic.GetComponent<Renderer>(), worksFolder + "/" + w.art, w.id, "art");
            }
            var frame = go.transform.Find("Frame");
            if (frame != null) frame.localScale = new Vector3(picW + frameMargin * 2f, picH + frameMargin * 2f, frame.localScale.z);
            var plate = go.transform.Find("Plate");
            if (plate != null)
            {
                plate.localScale = new Vector3(plateWidth, plateH, 1f);
                plate.localPosition = new Vector3(0f, -(picH * 0.5f + frameMargin + plateGap + plateH * 0.5f), plate.localPosition.z);
                Apply(plate.GetComponent<Renderer>(), worksFolder + "/" + w.plate, w.id, "plate");
            }
            made++;
        }
        AssetDatabase.SaveAssets();
        EditorUtility.DisplayDialog("Oekaki", made + " 件の作品を飾りました。" + (skipped > 0 ? "\n置き場所が足りず、" + skipped + " 件は飾れませんでした。" : ""), "OK");
    }

    void SetupTexture(string path)
    {
        var ti = AssetImporter.GetAtPath(path) as TextureImporter;
        if (ti == null) return;
        if (ti.maxTextureSize != maxTextureSize || ti.textureType != TextureImporterType.Default || ti.npotScale != TextureImporterNPOTScale.None)
        {
            ti.textureType = TextureImporterType.Default;
            ti.maxTextureSize = maxTextureSize;
            ti.npotScale = TextureImporterNPOTScale.None;   // 縦横比をそのまま保つ
            ti.SaveAndReimport();
        }
    }

    void Apply(Renderer r, string texPath, string id, string kind)
    {
        if (r == null) return;
        var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(texPath);
        if (tex == null) { Debug.LogWarning("画像が見つかりません: " + texPath); return; }
        var mat = new Material(baseMaterial) { mainTexture = tex, name = id + "_" + kind };
        string matPath = worksFolder + "/Works/" + id + "/" + kind + ".mat";
        AssetDatabase.DeleteAsset(matPath);
        AssetDatabase.CreateAsset(mat, matPath);
        r.sharedMaterial = mat;
    }
}
#endif
