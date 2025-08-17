from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import requests
from django.core.cache import cache
from django.conf import settings

POKE_BASE = "https://pokeapi.co/api/v2"
CACHE_TTL = 60 * 60  # 1 hour

def fetch_pokemon(identifier):
    key = f"pokemon:{identifier.lower()}"
    data = cache.get(key)
    if data:
        return data
    r = requests.get(f"{POKE_BASE}/pokemon/{identifier.lower()}/", timeout=6)
    if r.status_code != 200:
        return None
    data = r.json()
    cache.set(key, data, CACHE_TTL)
    return data

def fetch_type(type_name):
    key = f"type:{type_name}"
    data = cache.get(key)
    if data:
        return data
    r = requests.get(f"{POKE_BASE}/type/{type_name}/", timeout=6)
    if r.status_code != 200:
        return None
    data = r.json()
    cache.set(key, data, 24 * 3600)  # cache longer
    return data

def calc_best_multiplier(attacking_types, defending_types):
    """
    For each attacking type (a Pokémon's own types), compute multiplier vs defender types.
    We pick the best multiplier among attacking types (assume best move of that type).
    """
    best = 0.0
    for atk in attacking_types:
        at_name = atk['type']['name']
        tdata = fetch_type(at_name)
        if not tdata:
            continue
        dr = tdata.get('damage_relations', {})
        double = {x['name'] for x in dr.get('double_damage_to', [])}
        half   = {x['name'] for x in dr.get('half_damage_to', [])}
        no     = {x['name'] for x in dr.get('no_damage_to', [])}
        mult = 1.0
        for d in defending_types:
            dname = d['type']['name']
            if dname in double:
                mult *= 2.0
            if dname in half:
                mult *= 0.5
            if dname in no:
                mult *= 0.0
        if mult > best:
            best = mult
    return best

class PokemonProxyView(APIView):
    def get(self, request, identifier):
        data = fetch_pokemon(identifier)
        if not data:
            return Response({"detail":"Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)

class CompareView(APIView):
    def get(self, request):
        p1 = request.GET.get('p1')
        p2 = request.GET.get('p2')
        if not p1 or not p2:
            return Response({"detail":"p1 and p2 query params required"}, status=status.HTTP_400_BAD_REQUEST)

        a = fetch_pokemon(p1)
        b = fetch_pokemon(p2)
        if not a or not b:
            return Response({"detail":"One or both pokemon not found"}, status=status.HTTP_404_NOT_FOUND)

        # build simple stats comparison
        order = ['hp','attack','defense','special-attack','special-defense','speed']
        a_stats = {s['stat']['name']: s['base_stat'] for s in a['stats']}
        b_stats = {s['stat']['name']: s['base_stat'] for s in b['stats']}
        stats_cmp = []
        for name in order:
            av = a_stats.get(name, 0)
            bv = b_stats.get(name, 0)
            winner = 'tie' if av == bv else ('p1' if av > bv else 'p2')
            stats_cmp.append({'stat': name, 'p1': av, 'p2': bv, 'winner': winner})

        # types & effectiveness
        a_types = a.get('types', [])
        b_types = b.get('types', [])
        a_off = calc_best_multiplier(a_types, b_types)
        b_off = calc_best_multiplier(b_types, a_types)
        type_winner = 'tie' if a_off == b_off else ('p1' if a_off > b_off else 'p2')

        # minimal poke info to keep payload reasonable
        def minimal(p):
            return {
                'id': p['id'],
                'name': p['name'],
                'sprites': p['sprites'],
                'types': p['types'],
            }

        return Response({
            'p1': minimal(a),
            'p2': minimal(b),
            'stats': stats_cmp,
            'type_compare': {'p1_multiplier': a_off, 'p2_multiplier': b_off, 'winner': type_winner}
        })