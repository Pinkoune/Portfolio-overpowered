import { Component, type ReactNode } from 'react';

/**
 * Filet de sécurité autour du vaisseau : si la 3D ne démarre pas (contexte WebGL refusé, morceau
 * de code introuvable après un redéploiement…), on revient au mode classique au lieu d'une page vide.
 */
export class Failsafe extends Component<
  { onFail: (error: unknown) => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[PK-01] La 3D n’a pas pu démarrer, retour au mode classique.', error);
    this.props.onFail(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
