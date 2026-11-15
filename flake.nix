{
  description = "Development shell for the lv-desktop repository";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
      # nixos-26.05 stops at electron_44. P-0011.
      electronVersion = "45.3.3";
      electronHashes = {
        x86_64-linux = "0a63ce0e2b6a69d6ced7194949934b8414a6dadeca82910f88dc8720a1433269";
        aarch64-linux = "d0f66fca246ae244b8a9e08344b1d9383534e912ef364a80c5afe6e1698705a2";
        headers = "00xi69gfpgiwg9x10gnbv07fzbvzw6vjmyi124w092cng8pwgr8n";
      };
    in
    {
      devShells = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          mkElectron = pkgs.callPackage (nixpkgs + "/pkgs/development/tools/electron/binary/generic.nix") { };
          electron45 = mkElectron electronVersion electronHashes;
        in
        {
          default = pkgs.mkShell {
            packages = (with pkgs; [
              bashInteractive
              zsh
              git
              curl
              cacert
              coreutils
              python3
              nodejs_24
            ]) ++ [
              electron45
            ];
            env = {
              ELECTRON_OVERRIDE_DIST_PATH = "${electron45.dist}";
              ELECTRON_SKIP_BINARY_DOWNLOAD = "1";
            };
          };
        }
      );
    };
}
