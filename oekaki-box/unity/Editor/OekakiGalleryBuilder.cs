// Assets/Editor/OekakiGalleryBuilder.cs
// 変換済みの作品(works.json)から、額縁(2D)と台座の3Dを並べて、絵と説明板(タイトル・作者・コメント)を貼る。
// Unity のメニュー「Oekaki > ギャラリーを作る」から開く。エディタ専用なので、ワールドには含まれない。
#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEngine;

public class OekakiGalleryBuilder : EditorWindow
{
    [Serializable]
    class Work
    {
        public string id, display, title, nickname, comment, art, plate, model, model_texture, submitted_at;
        public float aspect;
        public int frame_slot, pedestal_slot;   // 何番目の置き場所か(1から。0なら、飾らない)
    }
    [Serializable] class WorkList { public Work[] works; }

    const string RootName = "OekakiGallery";

    string worksFolder = "Assets/OekakiWorks";   // works.json と Works フォルダを入れた場所
    Material baseMaterial;                       // 絵・説明板・3Dに使う材質の元(ワールドで使える色がそのまま出るもの)

    // --- 額縁(2D) ---
    GameObject framePrefab;                      // 子に Picture と Plate(どちらも Quad)を持つ額縁
    Transform frameSlots;                        // この親の子を、上から1番、2番、…の置き場所にする。空なら、一列に並べる
    float pictureHeight = 1.0f;                  // 絵の高さ(m)。横幅は、絵の縦横比で決まる
    float plateWidth = 0.8f;                     // 説明板の横幅(m)。縦は、その半分
    float frameMargin = 0.05f;                   // 絵のまわりの額縁の太さ(m)。子に Frame があれば、その大きさを合わせる
    float plateGap = 0.08f;                      // 絵と説明板のあいだ(m)
    Vector3 frameStart = Vector3.zero, frameStep = new Vector3(2.5f, 0f, 0f), frameRotation = Vector3.zero;

    // --- 3D(台座) ---
    Transform pedestalSlots;                     // この親の子を、上から1番、2番、…の台座にする。子の位置が、3Dを置く点(台座の上面の中心)
    float modelHeight = 0.6f;                    // 3Dの高さ(m)
    float plate3DWidth = 0.6f;                   // 3D用の説明板の横幅(m)。台座の子に PlateAnchor があれば、そこに置く
    Vector3 pedestalStart = Vector3.zero, pedestalStep = new Vector3(2f, 0f, 0f);

    int maxTextureSize = 1024;
    Vector2 scroll;

    [MenuItem("Oekaki/ギャラリーを作る")]
    static void Open() { GetWindow<OekakiGalleryBuilder>("Oekaki ギャラリー"); }

    void OnGUI()
    {
        scroll = EditorGUILayout.BeginScrollView(scroll);
        EditorGUILayout.LabelField("材料", EditorStyles.boldLabel);
        worksFolder = EditorGUILayout.TextField("作品のフォルダ", worksFolder);
        baseMaterial = (Material)EditorGUILayout.ObjectField("材質の元", baseMaterial, typeof(Material), false);
        maxTextureSize = EditorGUILayout.IntPopup("画像の最大サイズ", maxTextureSize, new[] { "512", "1024", "2048" }, new[] { 512, 1024, 2048 });

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("額縁(2D)", EditorStyles.boldLabel);
        framePrefab = (GameObject)EditorGUILayout.ObjectField("額縁のプレハブ", framePrefab, typeof(GameObject), false);
        frameSlots = (Transform)EditorGUILayout.ObjectField("額縁の置き場所の親(任意)", frameSlots, typeof(Transform), true);
        if (frameSlots == null)
        {
            frameStart = EditorGUILayout.Vector3Field("最初の位置", frameStart);
            frameStep = EditorGUILayout.Vector3Field("次との間隔", frameStep);
            frameRotation = EditorGUILayout.Vector3Field("向き", frameRotation);
        }
        else EditorGUILayout.HelpBox("親の子を、上から順に1番、2番…の壁として使います。子の青い矢印(Z軸)が、壁の方向を向くようにしてください。", MessageType.Info);
        pictureHeight = EditorGUILayout.FloatField("絵の高さ(m)", pictureHeight);
        plateWidth = EditorGUILayout.FloatField("説明板の横幅(m)", plateWidth);
        frameMargin = EditorGUILayout.FloatField("額縁の太さ(m)", frameMargin);
        plateGap = EditorGUILayout.FloatField("絵と説明板のあいだ(m)", plateGap);

        EditorGUILayout.Space();
        EditorGUILayout.LabelField("3D(台座)", EditorStyles.boldLabel);
        pedestalSlots = (Transform)EditorGUILayout.ObjectField("台座の置き場所の親(任意)", pedestalSlots, typeof(Transform), true);
        if (pedestalSlots == null)
        {
            pedestalStart = EditorGUILayout.Vector3Field("最初の位置", pedestalStart);
            pedestalStep = EditorGUILayout.Vector3Field("次との間隔", pedestalStep);
        }
        else EditorGUILayout.HelpBox("親の子を、上から順に1番、2番…の台座として使います。子の位置に3Dを置きます。子に PlateAnchor という空の子があれば、そこに説明板を置きます。", MessageType.Info);
        modelHeight = EditorGUILayout.FloatField("3Dの高さ(m)", modelHeight);
        plate3DWidth = EditorGUILayout.FloatField("3D用の説明板の横幅(m)", plate3DWidth);

        EditorGUILayout.Space();
        using (new EditorGUI.DisabledScope(baseMaterial == null))
        {
            if (GUILayout.Button("ギャラリーを作る(作り直す)", GUILayout.Height(32))) Build();
        }
        EditorGUILayout.EndScrollView();
    }

    void Build()
    {
        AssetDatabase.Refresh();   // コピーしたばかりのファイルを、先に取り込む
        string jsonPath = worksFolder + "/works.json";
        if (!File.Exists(jsonPath)) { EditorUtility.DisplayDialog("Oekaki", jsonPath + " が見つかりません。", "OK"); return; }
        var list = JsonUtility.FromJson<WorkList>(File.ReadAllText(jsonPath));
        if (list == null || list.works == null || list.works.Length == 0) { EditorUtility.DisplayDialog("Oekaki", "作品がありません。", "OK"); return; }
        bool needFrame = Array.Exists(list.works, w => w.frame_slot > 0);
        if (needFrame && framePrefab == null) { EditorUtility.DisplayDialog("Oekaki", "額縁のプレハブを選んでください。", "OK"); return; }

        var old = GameObject.Find(RootName);
        if (old != null) Undo.DestroyObjectImmediate(old);   // 作り直し
        var root = new GameObject(RootName);
        Undo.RegisterCreatedObjectUndo(root, "Oekaki ギャラリーを作る");

        try
        {
            AssetDatabase.StartAssetEditing();   // 画像の取り込み設定を、まとめて行う
            foreach (var w in list.works)
            {
                if (w.frame_slot > 0) { SetupTexture(worksFolder + "/" + w.art); SetupTexture(worksFolder + "/" + w.plate); }
                if (w.pedestal_slot > 0) { SetupTexture(worksFolder + "/" + w.model_texture); SetupTexture(worksFolder + "/" + w.plate); }
            }
        }
        finally { AssetDatabase.StopAssetEditing(); }
        AssetDatabase.Refresh();

        int frames = 0, models = 0, problems = 0;
        foreach (var w in list.works)
        {
            if (w.frame_slot > 0) { if (BuildFrame(root.transform, w)) frames++; else problems++; }
            if (w.pedestal_slot > 0) { if (BuildModel(root.transform, w)) models++; else problems++; }
        }
        AssetDatabase.SaveAssets();
        EditorUtility.DisplayDialog("Oekaki", "額縁 " + frames + " 件、3D " + models + " 件を飾りました。" +
            (problems > 0 ? "\n飾れなかったもの: " + problems + " 件(Console の警告を見てください)" : ""), "OK");
    }

    // 置き場所の位置と向きを返す。足りなければ false
    bool Slot(Transform parent, int number, Vector3 start, Vector3 step, Vector3 euler, out Vector3 pos, out Quaternion rot)
    {
        if (parent != null)
        {
            if (number < 1 || number > parent.childCount) { pos = Vector3.zero; rot = Quaternion.identity; return false; }
            var s = parent.GetChild(number - 1); pos = s.position; rot = s.rotation; return true;
        }
        pos = start + step * (number - 1); rot = Quaternion.Euler(euler); return true;
    }

    bool BuildFrame(Transform root, Work w)
    {
        Vector3 pos; Quaternion rot;
        if (!Slot(frameSlots, w.frame_slot, frameStart, frameStep, frameRotation, out pos, out rot))
        { Debug.LogWarning("額縁の置き場所 " + w.frame_slot + " 番が、ありません: " + w.id); return false; }

        var go = (GameObject)PrefabUtility.InstantiatePrefab(framePrefab, root);
        go.name = string.Format("Frame_{0:00}_{1}", w.frame_slot, w.id);
        go.transform.SetPositionAndRotation(pos, rot);

        float aspect = w.aspect > 0f ? w.aspect : 1f;
        float picW = pictureHeight * aspect, picH = pictureHeight, plateH = plateWidth * 0.5f;
        var pic = go.transform.Find("Picture");
        if (pic != null) { pic.localScale = new Vector3(picW, picH, 1f); Apply(pic.GetComponent<Renderer>(), worksFolder + "/" + w.art, w.id, "art"); }
        var frame = go.transform.Find("Frame");
        if (frame != null) frame.localScale = new Vector3(picW + frameMargin * 2f, picH + frameMargin * 2f, frame.localScale.z);
        var plate = go.transform.Find("Plate");
        if (plate != null)
        {
            plate.localScale = new Vector3(plateWidth, plateH, 1f);
            plate.localPosition = new Vector3(0f, -(picH * 0.5f + frameMargin + plateGap + plateH * 0.5f), plate.localPosition.z);
            Apply(plate.GetComponent<Renderer>(), worksFolder + "/" + w.plate, w.id, "plate");
        }
        return true;
    }

    bool BuildModel(Transform root, Work w)
    {
        Vector3 pos; Quaternion rot;
        if (!Slot(pedestalSlots, w.pedestal_slot, pedestalStart, pedestalStep, Vector3.zero, out pos, out rot))
        { Debug.LogWarning("台座の置き場所 " + w.pedestal_slot + " 番が、ありません: " + w.id); return false; }

        Mesh mesh = null;
        foreach (var o in AssetDatabase.LoadAllAssetsAtPath(worksFolder + "/" + w.model)) { if (o is Mesh m) { mesh = m; break; } }
        if (mesh == null) { Debug.LogWarning("3Dのファイルを読めません: " + w.model); return false; }

        var go = new GameObject(string.Format("Model_{0:00}_{1}", w.pedestal_slot, w.id));
        go.transform.SetParent(root, false);
        go.transform.SetPositionAndRotation(pos, rot);
        go.transform.localScale = Vector3.one * modelHeight;   // 変換した3Dは、高さ1、足元の中心が原点
        go.AddComponent<MeshFilter>().sharedMesh = mesh;
        var mr = go.AddComponent<MeshRenderer>();
        Apply(mr, worksFolder + "/" + w.model_texture, w.id, "model");

        // 説明板: 台座の子の PlateAnchor があれば、そこに置く
        Transform anchor = null;
        if (pedestalSlots != null && w.pedestal_slot <= pedestalSlots.childCount) anchor = pedestalSlots.GetChild(w.pedestal_slot - 1).Find("PlateAnchor");
        if (anchor != null)
        {
            var q = GameObject.CreatePrimitive(PrimitiveType.Quad);
            DestroyImmediate(q.GetComponent<Collider>());
            q.name = "Plate_" + w.id;
            q.transform.SetParent(root, false);
            q.transform.SetPositionAndRotation(anchor.position, anchor.rotation);
            q.transform.localScale = new Vector3(plate3DWidth, plate3DWidth * 0.5f, 1f);
            Apply(q.GetComponent<Renderer>(), worksFolder + "/" + w.plate, w.id, "plate3d");
        }
        return true;
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
