from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from pathlib import Path

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def read_env_path(path_value: str | None) -> Path | None:
    if not path_value:
        return None
    return Path(path_value).expanduser().resolve()


def resolve_script(script_env: str, repo_env: str, default_name: str) -> Path | None:
    script_path = read_env_path(os.environ.get(script_env))
    if script_path:
        return script_path

    repo_path = read_env_path(os.environ.get(repo_env))
    if repo_path:
        candidate = repo_path / default_name
        if candidate.exists():
            return candidate
    return None


def find_gfpgan_weight() -> Path | None:
    script_path = resolve_script("CDRCFC_GFPGAN_SCRIPT", "CDRCFC_GFPGAN_REPO", "inference_gfpgan.py")
    if not script_path:
        return None
    repo_root = script_path.parent
    version = os.environ.get("CDRCFC_GFPGAN_VERSION", "1.4").strip()
    candidates = [
        repo_root / "experiments" / "pretrained_models" / f"GFPGANv{version}.pth",
        repo_root / "gfpgan" / "weights" / f"GFPGANv{version}.pth",
        repo_root / "experiments" / "pretrained_models" / "GFPGANv1.4.pth",
        repo_root / "experiments" / "pretrained_models" / "GFPGANv1.3.pth",
        repo_root / "gfpgan" / "weights" / "GFPGANv1.4.pth",
        repo_root / "gfpgan" / "weights" / "GFPGANv1.3.pth",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def find_realesrgan_weight(model_name: str) -> Path | None:
    script_path = resolve_script("CDRCFC_REALESRGAN_SCRIPT", "CDRCFC_REALESRGAN_REPO", "inference_realesrgan.py")
    if not script_path:
        return None
    repo_root = script_path.parent
    candidates = [
        repo_root / "weights" / f"{model_name}.pth",
        repo_root / "experiments" / "pretrained_models" / f"{model_name}.pth",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def snapshot_files(root: Path) -> set[Path]:
    if not root.exists():
        return set()
    return {path.resolve() for path in root.rglob("*") if path.is_file()}


def pick_generated_file(root: Path, *, before: set[Path], input_stem: str) -> Path:
    candidates = [
        path.resolve()
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and path.resolve() not in before
    ]
    if candidates:
        return max(candidates, key=lambda item: item.stat().st_mtime)

    fallback = [
        path.resolve()
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS and input_stem in path.stem
    ]
    if fallback:
        return max(fallback, key=lambda item: item.stat().st_mtime)

    raise FileNotFoundError(f"No generated image found in {root}")


def run_command(command: list[str], *, cwd: Path) -> None:
    subprocess.run(command, cwd=str(cwd), check=True)


def should_force_fp32() -> bool:
    if os.environ.get("CDRCFC_REALESRGAN_FP32", "").strip().lower() in {"1", "true", "yes"}:
        return True
    try:
        import torch  # type: ignore

        return not torch.cuda.is_available()
    except Exception:  # noqa: BLE001
        return True


def run_gfpgan(input_path: Path, output_root: Path) -> Path:
    script_path = resolve_script("CDRCFC_GFPGAN_SCRIPT", "CDRCFC_GFPGAN_REPO", "inference_gfpgan.py")
    if not script_path:
        raise RuntimeError("GFPGAN is not configured. Set CDRCFC_GFPGAN_SCRIPT or CDRCFC_GFPGAN_REPO.")

    output_root.mkdir(parents=True, exist_ok=True)
    before = snapshot_files(output_root)
    python_exe = os.environ.get("CDRCFC_GFPGAN_PYTHON", "python")
    version = os.environ.get("CDRCFC_GFPGAN_VERSION", "1.4")
    upscale = os.environ.get("CDRCFC_GFPGAN_UPSCALE", "2")
    if not find_gfpgan_weight():
        raise RuntimeError("GFPGAN weight not found. Expected GFPGANv*.pth under experiments/pretrained_models.")

    command = [
        python_exe,
        str(script_path),
        "-i",
        str(input_path),
        "-o",
        str(output_root),
        "-v",
        version,
        "-s",
        upscale,
        "--bg_upsampler",
        "none",
    ]
    run_command(command, cwd=script_path.parent)
    return pick_generated_file(output_root, before=before, input_stem=input_path.stem)


def run_realesrgan(input_path: Path, output_root: Path) -> Path:
    script_path = resolve_script("CDRCFC_REALESRGAN_SCRIPT", "CDRCFC_REALESRGAN_REPO", "inference_realesrgan.py")
    if not script_path:
        raise RuntimeError("Real-ESRGAN is not configured. Set CDRCFC_REALESRGAN_SCRIPT or CDRCFC_REALESRGAN_REPO.")

    output_root.mkdir(parents=True, exist_ok=True)
    before = snapshot_files(output_root)
    python_exe = os.environ.get("CDRCFC_REALESRGAN_PYTHON", "python")
    model_name = os.environ.get("CDRCFC_REALESRGAN_MODEL_NAME", "RealESRGAN_x4plus")
    upscale = os.environ.get("CDRCFC_REALESRGAN_OUTSCALE", "2")
    tile = os.environ.get("CDRCFC_REALESRGAN_TILE", "0")
    weight_path = find_realesrgan_weight(model_name)
    if not weight_path:
        raise RuntimeError(f"Real-ESRGAN weight not found for model {model_name}.")

    command = [
        python_exe,
        str(script_path),
        "-i",
        str(input_path),
        "-o",
        str(output_root),
        "-n",
        model_name,
        "-s",
        upscale,
        "--model_path",
        str(weight_path),
        "--tile",
        tile,
    ]
    if should_force_fp32():
        command.append("--fp32")

    run_command(command, cwd=script_path.parent)
    return pick_generated_file(output_root, before=before, input_stem=input_path.stem)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run optional AI enhancement for cdrcfc image processing.")
    parser.add_argument("--profile", choices=("player", "generic"), required=True)
    parser.add_argument("--input", required=True, help="Input image path.")
    parser.add_argument("--output", required=True, help="Output image path.")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    work_root = read_env_path(os.environ.get("CDRCFC_AI_TMP_DIR")) or (output_path.parent / ".ai-work")
    work_root.mkdir(parents=True, exist_ok=True)

    current_path = input_path

    if args.profile == "player":
        if find_gfpgan_weight():
            current_path = run_gfpgan(current_path, work_root / "gfpgan")
        if find_realesrgan_weight(os.environ.get("CDRCFC_REALESRGAN_MODEL_NAME", "RealESRGAN_x4plus")):
            current_path = run_realesrgan(current_path, work_root / "realesrgan")
        if current_path == input_path:
            raise RuntimeError("No player enhancer configured with usable weights. Add GFPGAN and/or Real-ESRGAN weights.")
    else:
        current_path = run_realesrgan(current_path, work_root / "realesrgan")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(current_path, output_path)
    print(output_path)


if __name__ == "__main__":
    main()
